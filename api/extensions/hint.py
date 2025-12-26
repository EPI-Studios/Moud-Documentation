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
        counter = 0
        
        for line in lines:
            hint_match = re.match(r'^```hint\s*(\w+)?\s*(.*)?$', line.strip())
            if hint_match:
                in_hint_block = True
                hint_content = []
                hint_type = hint_match.group(1) or 'info'
                hint_title = hint_match.group(2) or ''
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
                    'note': '<span class="material-symbols-rounded">description</span>'
                }
                
                valid_types = ['info', 'warning', 'error', 'success', 'tip', 'note']
                if hint_type not in valid_types:
                    invalid_type = hint_type
                    hint_type = 'info'
                    logger.warning(f"Invalid hint type '{invalid_type}', defaulting to 'info'")
                
                icon = icon_map.get(hint_type, icon_map['info'])
                display_title = hint_title if hint_title else hint_type.title()
                
                import html
                display_title = html.escape(display_title)
                
                placeholder = f'''<div class="mdoc-hint mdoc-hint-{hint_type}" id="hint-{counter}">
    <div class="hint-header">
        <div class="hint-icon">{icon}</div>
        <h4 class="hint-title">{display_title}</h4>
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
                'note': '<span class="material-symbols-rounded">description</span>'
            }

            valid_types = ['info', 'warning', 'error', 'success', 'tip', 'note']
            if hint_type not in valid_types:
                invalid_type = hint_type
                hint_type = 'info'
                logger.warning(f"Invalid hint type '{invalid_type}', defaulting to 'info'")

            icon = icon_map.get(hint_type, icon_map['info'])
            display_title = hint_title if hint_title else hint_type.title()
            
            import html
            display_title = html.escape(display_title)
            
            placeholder = f'''<div class="mdoc-hint mdoc-hint-{hint_type}" id="hint-{counter}">
    <div class="hint-header">
        <div class="hint-icon">{icon}</div>
        <h4 class="hint-title">{display_title}</h4>
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
