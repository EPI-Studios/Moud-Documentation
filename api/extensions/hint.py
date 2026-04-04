from markdown.extensions import Extension
from markdown.preprocessors import Preprocessor
import re
import logging

logger = logging.getLogger(__name__)

class HintPreprocessor(Preprocessor):
    def run(self, lines):
        new_lines = []
        in_hint_block = False
        hint_content = []
        hint_type = 'info'
        hint_title = ''
        hint_id = None
        counter = 0
        
        for line in lines:
            hint_match = re.match(r'^```hint\s*(\w+)?\s*(.*)?$', line.strip())
            if hint_match:
                in_hint_block = True
                hint_content = []
                hint_id = None

                raw_type = hint_match.group(1) or 'info'
                rest = (hint_match.group(2) or '').strip()

                if raw_type and "#" in raw_type:
                    raw_type, raw_id = raw_type.split("#", 1)
                    hint_id = raw_id.strip()

                id_match = re.search(r'(?:^|\s)id=([a-zA-Z0-9_-]+)(?:\s|$)', rest)
                if id_match:
                    hint_id = id_match.group(1)
                    rest = (rest[:id_match.start()] + rest[id_match.end():]).strip()

                hash_match = re.match(r'^#([a-zA-Z0-9_-]+)\s*(.*)$', rest)
                if hash_match:
                    hint_id = hash_match.group(1)
                    rest = (hash_match.group(2) or '').strip()

                hint_type = raw_type
                hint_title = rest
                continue
            elif in_hint_block and line.strip() == '```':
                in_hint_block = False
                
                try:
                    import markdown
                    content_text = '\n'.join(hint_content)
                    processed_content = markdown.markdown(
                        content_text, 
                        extensions=['fenced_code', 'codehilite'],
                        output_format='html5'
                    )
                except Exception as e:
                    logger.error(f"Error processing hint content: {e}")
                    processed_content = '<p>' + '\n'.join(hint_content) + '</p>'
                
                icon_map = {
                    'info': '<span class="material-symbols-rounded">info</span>',
                    'warning': '<span class="material-symbols-rounded">warning</span>',
                    'error': '<span class="material-symbols-rounded">error</span>',
                    'success': '<span class="material-symbols-rounded">check_circle</span>',
                    'tip': '<span class="material-symbols-rounded">lightbulb</span>',
                    'note': '<span class="material-symbols-rounded">description</span>',
                    'danger': '<span class="material-symbols-rounded">report</span>',
                    'important': '<span class="material-symbols-rounded">priority_high</span>',
                    'example': '<span class="material-symbols-rounded">school</span>',
                    'debug': '<span class="material-symbols-rounded">bug_report</span>'
                }

                type_aliases = {
                    'warn': 'warning',
                    'err': 'error',
                }
                hint_type = type_aliases.get(hint_type, hint_type)
                
                valid_types = ['info', 'warning', 'error', 'success', 'tip', 'note', 'danger', 'important', 'example', 'debug']
                if hint_type not in valid_types:
                    invalid_type = hint_type
                    hint_type = 'info'
                    logger.warning(f"Invalid hint type '{invalid_type}', defaulting to 'info'")
                
                icon = icon_map.get(hint_type, icon_map['info'])
                display_title = hint_title if hint_title else hint_type.title()
                
                import html
                display_title = html.escape(display_title)

                block_id = hint_id if hint_id else f"hint-{counter}"
                anchor = f'<a class="hint-anchor" href="#{block_id}" title="Link to this hint"><span class="material-symbols-rounded">link</span></a>'

                placeholder = f'''<div class="mdoc-hint mdoc-hint-{hint_type}" id="{block_id}">
    <div class="hint-header">
        <div class="hint-icon">{icon}</div>
        <h4 class="hint-title">{display_title}</h4>
        {anchor}
    </div>
    <div class="hint-content">
        {processed_content}
    </div>
</div>'''
                
                new_lines.append(placeholder)
                counter += 1
                continue
            
            if in_hint_block:
                hint_content.append(line)
            else:
                new_lines.append(line)
                
        if in_hint_block:
            logger.warning("Unclosed hint block detected, closing automatically")
            try:
                import markdown
                content_text = '\n'.join(hint_content)
                processed_content = markdown.markdown(
                    content_text, 
                    extensions=['fenced_code', 'codehilite'],
                    output_format='html5'
                )
            except Exception as e:
                logger.error(f"Error processing unclosed hint content: {e}")
                processed_content = '<p>' + '\n'.join(hint_content) + '</p>'
            
            icon_map = {
                'info': '<span class="material-symbols-rounded">info</span>',
                'warning': '<span class="material-symbols-rounded">warning</span>',
                'error': '<span class="material-symbols-rounded">error</span>',
                'success': '<span class="material-symbols-rounded">check_circle</span>',
                'tip': '<span class="material-symbols-rounded">lightbulb</span>',
                'note': '<span class="material-symbols-rounded">description</span>',
                'danger': '<span class="material-symbols-rounded">report</span>',
                'important': '<span class="material-symbols-rounded">priority_high</span>',
                'example': '<span class="material-symbols-rounded">school</span>',
                'debug': '<span class="material-symbols-rounded">bug_report</span>'
            }

            type_aliases = {
                'warn': 'warning',
                'err': 'error',
            }
            hint_type = type_aliases.get(hint_type, hint_type)

            valid_types = ['info', 'warning', 'error', 'success', 'tip', 'note', 'danger', 'important', 'example', 'debug']
            if hint_type not in valid_types:
                invalid_type = hint_type
                hint_type = 'info'
                logger.warning(f"Invalid hint type '{invalid_type}', defaulting to 'info'")

            icon = icon_map.get(hint_type, icon_map['info'])
            display_title = hint_title if hint_title else hint_type.title()
            
            import html
            display_title = html.escape(display_title)

            block_id = hint_id if hint_id else f"hint-{counter}"
            anchor = f'<a class="hint-anchor" href="#{block_id}" title="Link to this hint"><span class="material-symbols-rounded">link</span></a>'
            
            placeholder = f'''<div class="mdoc-hint mdoc-hint-{hint_type}" id="{block_id}">
    <div class="hint-header">
        <div class="hint-icon">{icon}</div>
        <h4 class="hint-title">{display_title}</h4>
        {anchor}
    </div>
    <div class="hint-content">
        {processed_content}
    </div>
</div>'''
            
            new_lines.append(placeholder)
                
        return new_lines

class HintExtension(Extension):
    def extendMarkdown(self, md):
        md.preprocessors.register(HintPreprocessor(md), 'hint', 170)

def makeExtension(**kwargs):
    return HintExtension(**kwargs)
