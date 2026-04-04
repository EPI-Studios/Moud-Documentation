from markdown.extensions import Extension
from markdown.preprocessors import Preprocessor
import re


class TabsPreprocessor(Preprocessor):
    def run(self, lines):
        new_lines = []
        in_tabs = False
        tabs_fence = None
        tab_title = None
        tab_lines = []
        tabs = []
        counter = 0

        def flush_tab():
            nonlocal tab_title, tab_lines, tabs
            if tab_title is None:
                return
            tabs.append((tab_title, "\n".join(tab_lines).strip("\n")))
            tab_title = None
            tab_lines = []

        for line in lines:
            fence_match = re.match(r"^(`{3,})tabs\s*$", line.strip())
            if not in_tabs and fence_match:
                in_tabs = True
                tabs_fence = fence_match.group(1)
                tab_title = None
                tab_lines = []
                tabs = []
                continue

            if in_tabs:
                if tabs_fence and line.strip() == tabs_fence:
                    flush_tab()
                    in_tabs = False
                    tabs_fence = None

                    if not tabs:
                        new_lines.append(
                            '<div class="mdoc-tabs mdoc-tabs-error">Error: empty tabs block.</div>',
                        )
                        continue

                    group_id = f"tabs-{counter}"
                    counter += 1

                    try:
                        import markdown
                        from api.extensions.badge import BadgeExtension
                        from api.extensions.desmos import DesmosExtension
                        from api.extensions.geogebra import GeoGebraExtension
                        from api.extensions.glsl import GlslExtension
                        from api.extensions.hint import HintExtension
                        from api.extensions.mermaid import MermaidExtension
                        from api.extensions.p5js import P5jsExtension

                        rendered_tabs = []
                        for i, (title, content) in enumerate(tabs):
                            html = markdown.markdown(
                                content,
                                extensions=[
                                    "fenced_code",
                                    "tables",
                                    "md_in_html",
                                    BadgeExtension(),
                                    HintExtension(),
                                    GlslExtension(),
                                    DesmosExtension(),
                                    MermaidExtension(),
                                    GeoGebraExtension(),
                                    P5jsExtension(),
                                ],
                                output_format="html5",
                            )
                            rendered_tabs.append((i, title, html))
                    except Exception:
                        rendered_tabs = [(i, t, f"<pre><code>{c}</code></pre>") for i, (t, c) in enumerate(tabs)]

                    header_parts = []
                    panel_parts = []
                    for i, title, html in rendered_tabs:
                        is_active = i == 0
                        tab_id = f"{group_id}-tab-{i}"
                        panel_id = f"{group_id}-panel-{i}"

                        header_parts.append(
                            (
                                f'<button class="mdoc-tab{" is-active" if is_active else ""}" '
                                f'type="button" id="{tab_id}" role="tab" '
                                f'data-tab-group="{group_id}" data-tab="{i}" '
                                f'aria-selected="{"true" if is_active else "false"}" '
                                f'aria-controls="{panel_id}">{title}</button>'
                            ),
                        )

                        panel_parts.append(
                            (
                                f'<div class="mdoc-tab-panel{" is-active" if is_active else ""}" '
                                f'id="{panel_id}" role="tabpanel" '
                                f'data-tab-group="{group_id}" data-tab="{i}" '
                                f'aria-labelledby="{tab_id}">{html}</div>'
                            ),
                        )

                    placeholder = (
                        f'<div class="mdoc-tabs" id="{group_id}">'
                        f'<div class="mdoc-tabs-header" role="tablist">'
                        + "".join(header_parts)
                        + "</div>"
                        f'<div class="mdoc-tabs-panels">'
                        + "".join(panel_parts)
                        + "</div>"
                        + "</div>"
                    )
                    new_lines.append(placeholder)
                    continue

                tab_match = re.match(r"^---\s*tab:\s*(.+?)\s*$", line)
                if tab_match:
                    flush_tab()
                    tab_title = tab_match.group(1).strip()
                    tab_lines = []
                    continue

                tab_lines.append(line)
                continue

            new_lines.append(line)

        if in_tabs:
            flush_tab()
            new_lines.append('<div class="mdoc-tabs mdoc-tabs-error">Error: unclosed tabs block.</div>')

        return new_lines


class TabsExtension(Extension):
    def extendMarkdown(self, md):
        md.preprocessors.register(TabsPreprocessor(md), "tabs", 165)


def makeExtension(**kwargs):
    return TabsExtension(**kwargs)
