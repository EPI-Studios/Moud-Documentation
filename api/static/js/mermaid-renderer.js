function mdocInitMermaidDiagrams() {
    const mermaidElements = document.querySelectorAll('.mdoc-mermaid:not([data-mdoc-initialized="1"])');
    if (mermaidElements.length === 0) {
        return;
    }

    if (window.mermaid) {
        initializeMermaidDiagrams(mermaidElements);
        return;
    }

    if (window.__mdocMermaidLoading) {
        window.__mdocMermaidLoading.then(() => initializeMermaidDiagrams(mermaidElements));
        return;
    }

    window.__mdocMermaidLoading = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
    });

    window.__mdocMermaidLoading
        .then(() => initializeMermaidDiagrams(mermaidElements))
        .catch(() => {});
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mdocInitMermaidDiagrams);
} else {
    mdocInitMermaidDiagrams();
}
document.addEventListener('mdoc:content-updated', mdocInitMermaidDiagrams);

function initializeMermaidDiagrams(placeholders) {
    mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'strict'
    });

    placeholders = placeholders || document.querySelectorAll('.mdoc-mermaid:not([data-mdoc-initialized="1"])');

    placeholders.forEach((placeholder) => {
        placeholder.setAttribute('data-mdoc-initialized', '1');
        try {
            const encodedDiagram = placeholder.getAttribute('data-diagram');
            if (!encodedDiagram) {
                console.error('No diagram definition found for Mermaid diagram');
                return;
            }
            placeholder.innerHTML = '';
            const diagramDefinition = atob(encodedDiagram);
            renderDiagram(placeholder, diagramDefinition);
        } catch (error) {
            console.error('Error initializing Mermaid diagram:', error);
            const errorMsg = document.createElement('div');
            errorMsg.className = 'mermaid-error';
            errorMsg.textContent = 'Error rendering diagram: ' + (error.message || 'Unknown error');
            placeholder.appendChild(errorMsg);
        }
    });
}

function renderDiagram(container, definition) {
    container.innerHTML = '';
    const pre = document.createElement('pre');
    pre.className = 'mermaid';
    pre.textContent = definition;
    container.appendChild(pre);
    mermaid.run({
        nodes: [pre],
        suppressErrors: true
    });
}
