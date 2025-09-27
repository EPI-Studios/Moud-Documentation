import os
import functools
import re
from api.utils.github_utils import is_recently_updated

@functools.lru_cache(maxsize=128)
def get_all_documents():
    try:
        documents = []
        docs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates', 'docs')
        
        if not os.path.exists(docs_dir):
            os.makedirs(docs_dir)
            return []
        
        def scan_directory(current_dir, parent_path=""):
            for item in os.listdir(current_dir):
                item_path = os.path.join(current_dir, item)
                
                if os.path.isfile(item_path):
                    if item.endswith('.html') and item not in ['index.html', 'markdown_base.html', 'error.html', 'print.html']:
                        filename = item.replace('.html', '')
                        full_path = f"{parent_path}/{filename}" if parent_path else filename
                        title = extract_clean_title(filename)
                        section = extract_section_from_path(parent_path) if parent_path else "Documentation"
                        
                        if section and section not in ["Test", "Example"]:
                            documents.append({
                                'filename': full_path,
                                'title': title,
                                'section': section,
                                'category': section,
                                'is_subdoc': bool(parent_path),
                                'parent': parent_path if parent_path else None,
                                'recently_updated': is_recently_updated(full_path),
                                'order': get_order_from_filename(filename),
                                'section_order': get_section_order_from_path(parent_path) if parent_path else 999
                            })
                    elif item.endswith('.md'):
                        filename = item.replace('.md', '')
                        full_path = f"{parent_path}/{filename}" if parent_path else filename
                        title = extract_clean_title(filename)
                        section = extract_section_from_path(parent_path) if parent_path else "Documentation"
                        
                        try:
                            with open(item_path, 'r', encoding='utf-8') as file:
                                first_line = file.readline().strip()
                                if first_line.startswith('# '):
                                    title = first_line[2:].strip()
                        except Exception:
                            pass
                        
                        if section and section not in ["Meekleboss", "Test", "Example"]:
                            documents.append({
                                'filename': full_path,
                                'title': title,
                                'section': section,
                                'category': section,
                                'is_subdoc': bool(parent_path),
                                'parent': parent_path if parent_path else None,
                                'recently_updated': is_recently_updated(full_path),
                                'order': get_order_from_filename(filename),
                                'section_order': get_section_order_from_path(parent_path) if parent_path else 999
                            })
                
                elif os.path.isdir(item_path):
                    new_parent = f"{parent_path}/{item}" if parent_path else item
                    scan_directory(item_path, new_parent)
        
        scan_directory(docs_dir)
        
        folder_names = set()
        for doc in documents:
            if doc['is_subdoc'] and doc['parent']:
                folder_names.add(doc['parent'])
        
        existing_parents = set(doc['filename'] for doc in documents if not doc['is_subdoc'])
        
        for folder_name in folder_names:
            if folder_name not in existing_parents:
                section = extract_section_from_path(folder_name)
                if section and section not in ["Meekleboss", "Test", "Example"]:
                    documents.append({
                        'filename': folder_name,
                        'title': extract_clean_title(folder_name.split('/')[-1]),
                        'section': section,
                        'category': section,
                        'is_subdoc': False,
                        'parent': None,
                        'recently_updated': False,
                        'order': 999,
                        'section_order': get_section_order_from_path(folder_name),
                        'is_virtual': True
                    })
        
        return sorted(documents, key=lambda x: (x['section_order'], x['section'], x['order'], x['title']))
        
    except Exception as e:
        print(f"Error getting documents: {str(e)}")
        return []

def extract_clean_title(filename):
    parts = filename.split('_', 1)
    if len(parts) > 1 and parts[0].isdigit():
        return parts[1].replace('_', ' ').title()
    return filename.replace('_', ' ').title()

def extract_section_from_path(path):
    if not path:
        return "Documentation"
    
    parts = path.split('/')
    section_part = parts[0]
    
    section_parts = section_part.split('_', 1)
    if len(section_parts) > 1 and section_parts[0].isdigit():
        return section_parts[1].replace('_', ' ').title()
    
    if section_part.lower() in ['meekleboss', 'misc', 'other']:
        return None
    
    return section_part.replace('_', ' ').title()

def get_section_order_from_path(path):
    if not path:
        return 999
    
    parts = path.split('/')
    section_part = parts[0]
    
    section_parts = section_part.split('_', 1)
    if len(section_parts) > 1 and section_parts[0].isdigit():
        return int(section_parts[0])
    return 999

def get_order_from_filename(filename):
    parts = filename.split('_', 1)
    if len(parts) > 1 and parts[0].isdigit():
        return int(parts[0])
    return 999

def get_sections():
    documents = get_all_documents()
    sections = {}
    
    for doc in documents:
        section = doc.get('section', 'Documentation')
        if section not in sections:
            sections[section] = {
                'name': section,
                'order': doc.get('section_order', 999),
                'documents': []
            }
        sections[section]['documents'].append(doc)
    
    return dict(sorted(sections.items(), key=lambda x: x[1]['order']))

def get_documents_by_section():
    return get_sections()

def get_documents_by_category():
    return get_sections()

def get_subdocuments(parent_path):
    documents = get_all_documents()
    return sorted(
        [doc for doc in documents if doc.get('parent') == parent_path],
        key=lambda x: x['order']
    )

def get_first_subdocument(parent_path):
    subdocs = get_subdocuments(parent_path)
    if subdocs:
        return min(subdocs, key=lambda x: x['order'])
    return None

def get_sibling_navigation(doc_path):
    if '/' not in doc_path:
        return None, None
    
    parent_path = '/'.join(doc_path.split('/')[:-1])
    subdocs = sorted(get_subdocuments(parent_path), key=lambda x: x['order'])
    
    current_index = None
    for i, doc in enumerate(subdocs):
        if doc['filename'] == doc_path:
            current_index = i
            break
    
    if current_index is None:
        return None, None
    
    prev_doc = subdocs[current_index - 1] if current_index > 0 else None
    next_doc = subdocs[current_index + 1] if current_index < len(subdocs) - 1 else None
    
    return prev_doc, next_doc