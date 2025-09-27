def generate_breadcrumbs(template_name):
    """Generate clean breadcrumbs for a given template path"""
    breadcrumbs = []
    
    if '/' in template_name:
        parts = template_name.split('/')
        for i, part in enumerate(parts):
            path = '/'.join(parts[:i+1])
            
            if '_' in part and part.split('_')[0].isdigit():
                name = '_'.join(part.split('_')[1:]).replace('_', ' ').title()
            else:
                name = part.replace('_', ' ').title()
            
            breadcrumbs.append({
                'name': name, 
                'path': path, 
                'is_current': i == len(parts) - 1
            })
    
    return breadcrumbs

def extract_clean_title_from_path(path_part):
    """Extract clean title from a path part, removing number prefixes"""
    parts = path_part.split('_', 1)
    if len(parts) > 1 and parts[0].isdigit():
        return parts[1].replace('_', ' ').title()
    return path_part.replace('_', ' ').title()