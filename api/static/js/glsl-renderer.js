function mdocInitGlslCanvases() {
    const glslElements = document.querySelectorAll('.mdoc-glsl-canvas:not([data-mdoc-initialized="1"])');
    if (glslElements.length === 0) {
        return;
    }

    if (window.GlslCanvas) {
        initializeGlslCanvases(glslElements);
        return;
    }

    if (window.__mdocGlslCanvasLoading) {
        window.__mdocGlslCanvasLoading.then(() => initializeGlslCanvases(glslElements));
        return;
    }

    window.__mdocGlslCanvasLoading = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/glslCanvas@0.2.6/dist/GlslCanvas.min.js';
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
    });

    window.__mdocGlslCanvasLoading
        .then(() => initializeGlslCanvases(glslElements))
        .catch(() => {
            // noop
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mdocInitGlslCanvases);
} else {
    mdocInitGlslCanvases();
}
document.addEventListener('mdoc:content-updated', mdocInitGlslCanvases);

function initializeGlslCanvases(placeholders) {
    placeholders = placeholders || document.querySelectorAll('.mdoc-glsl-canvas:not([data-mdoc-initialized="1"])');

    placeholders.forEach((placeholder, index) => {
        placeholder.setAttribute('data-mdoc-initialized', '1');
        try {
            const encodedShader = placeholder.getAttribute('data-fragment-shader');
            const simpleDisplay = placeholder.getAttribute('data-simple-display') === 'true';
            const noUI = placeholder.getAttribute('data-no-ui') === 'true';
            const customWidth = parseInt(placeholder.getAttribute('data-width')) || 600;
            const customHeight = parseInt(placeholder.getAttribute('data-height')) || 400;

            if (!encodedShader) {
                console.error(`No shader code found for GLSL canvas ${index}`);
                placeholder.textContent = 'Error: Shader code missing.';
                return;
            }

            const shaderCode = atob(encodedShader);

            // Clear existing content
            placeholder.innerHTML = '';

            if (noUI) {
                // Ensure data-no-ui attribute is set (redundant but safe)
                placeholder.setAttribute('data-no-ui', 'true');

                // Apply no-UI styles directly to ensure they take effect
                placeholder.style.margin = '0';
                placeholder.style.border = 'none';
                placeholder.style.padding = '0';
                placeholder.style.background = 'none';
                placeholder.style.overflow = 'visible';

                // Create a simple canvas with no UI elements
                const canvas = document.createElement('canvas');
                canvas.width = customWidth;
                canvas.height = customHeight;
                canvas.className = 'glsl-canvas-noui';
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                canvas.style.display = 'block';
                canvas.style.border = 'none';
                canvas.style.margin = '0';
                canvas.style.padding = '0';

                placeholder.appendChild(canvas);

                const glslCanvas = new GlslCanvas(canvas);
                if (glslCanvas) {
                    glslCanvas.load(shaderCode);
                    setupMouseInteraction(canvas, glslCanvas);
                    startAnimationLoopIfNeeded(glslCanvas, shaderCode);
                    requestRender(glslCanvas);
                }
            } else if (simpleDisplay) {
                // Create a simple display with minimal UI
                const canvas = document.createElement('canvas');
                canvas.width = customWidth;
                canvas.height = customHeight;
                canvas.className = 'glsl-canvas-simple';
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                canvas.style.display = 'block';
                placeholder.appendChild(canvas);

                const glslCanvas = new GlslCanvas(canvas);
                if (glslCanvas) {
                    glslCanvas.load(shaderCode);
                    setupMouseInteraction(canvas, glslCanvas);
                    startAnimationLoopIfNeeded(glslCanvas, shaderCode);
                    requestRender(glslCanvas);
                }
            } else {
                // Create full UI structure
                const header = document.createElement('div');
                header.className = 'component-header';
                header.textContent = 'Interactive Shader';
                placeholder.appendChild(header);

                const body = document.createElement('div');
                body.className = 'component-body';
                placeholder.appendChild(body);

                // Controls
                const controls = document.createElement('div');
                controls.className = 'glsl-controls';
                body.appendChild(controls);

                const spacer = document.createElement('span');
                spacer.style.flex = '1';
                controls.appendChild(spacer);

                const pauseBtn = document.createElement('button');
                pauseBtn.className = 'glsl-control-btn';
                pauseBtn.textContent = 'Pause';
                controls.appendChild(pauseBtn);

                const resetBtn = document.createElement('button');
                resetBtn.className = 'glsl-control-btn';
                resetBtn.textContent = 'Reset';
                controls.appendChild(resetBtn);

                // Canvas
                const canvas = document.createElement('canvas');
                canvas.width = customWidth;
                canvas.height = customHeight;
                canvas.className = 'glsl-canvas';
                body.appendChild(canvas);

                // Info panel
                const infoDiv = document.createElement('div');
                infoDiv.className = 'glsl-info';
                const timeInfo = document.createElement('div');
                timeInfo.className = 'time';
                timeInfo.textContent = 'Time: 0.0s';
                const fpsCounter = document.createElement('div');
                fpsCounter.className = 'fps';
                fpsCounter.textContent = 'FPS: --';
                infoDiv.appendChild(timeInfo);
                infoDiv.appendChild(fpsCounter);
                body.appendChild(infoDiv);

                const glslCanvas = new GlslCanvas(canvas);
                if (glslCanvas) {
                    glslCanvas.load(shaderCode);
                    setupMouseInteraction(canvas, glslCanvas);
                    setupPerformanceMonitor(infoDiv, glslCanvas);

                    let isPaused = false;
                    let lastTime = 0;
                    let startTime = performance.now() / 1000;

                    // Override the default render loop
                    const originalRender = glslCanvas.render;
                    glslCanvas.render = function() {
                        if (!isPaused) {
                            const currentTime = performance.now() / 1000 - startTime;
                            glslCanvas.uniforms.u_time = { type: 'f', value: currentTime };
                            originalRender.call(glslCanvas);
                        } else {
                            // Still render but keep time frozen
                            originalRender.call(glslCanvas);
                        }
                        requestAnimationFrame(() => this.render());
                    };

                    // Add play/pause methods
                    glslCanvas.pause = function() {
                        isPaused = true;
                        lastTime = glslCanvas.uniforms.u_time?.value || 0;
                    };

                    glslCanvas.play = function() {
                        isPaused = false;
                        startTime = performance.now() / 1000 - lastTime;
                    };

                    glslCanvas.reset = function() {
                        startTime = performance.now() / 1000;
                        isPaused = false;
                        glslCanvas.uniforms.u_time = { type: 'f', value: 0 };
                        glslCanvas.uniforms.u_mouse = { type: 'vec2', value: [0.5, 0.5] };
                        glslCanvas.uniforms.u_mouseDown = { type: 'f', value: 0.0 };
                        glslCanvas.load(shaderCode);
                    };

                    pauseBtn.addEventListener('click', function() {
                        isPaused = !isPaused;
                        pauseBtn.textContent = isPaused ? 'Play' : 'Pause';
                        if (isPaused) {
                            glslCanvas.pause();
                        } else {
                            glslCanvas.play();
                        }
                    });

                    resetBtn.addEventListener('click', function() {
                        glslCanvas.reset();
                        pauseBtn.textContent = 'Pause';
                    });

                    // Start the render loop
                    glslCanvas.__mdocHasRenderLoop = true;
                    glslCanvas.render();
                }
            }
        } catch (error) {
            console.error(`Error initializing GLSL canvas ${index}:`, error);
            placeholder.innerHTML = '';
            const errorMsg = document.createElement('div');
            errorMsg.className = 'glsl-error';
            errorMsg.textContent = 'Error loading shader: ' + (error.message || 'Unknown error');
            placeholder.appendChild(errorMsg);
        }
    });
}

function setupMouseInteraction(canvas, glslCanvas) {
    let isMouseDown = false;
    let lastX = 0, lastY = 0;

    function setMouseDown(down) {
        isMouseDown = down;
        setUniformFloat(glslCanvas, 'u_mouseDown', down ? 1.0 : 0.0);
        if (!glslCanvas.__mdocHasRenderLoop) {
            requestRender(glslCanvas);
        }
    }

    function updateMouse(e) {
        // Prevent glslCanvas internal mouse handlers (some builds overwrite `u_mouse` in pixel-space).
        if (e && typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        } else if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = rect.height - (e.clientY - rect.top);

        const normX = Math.max(0, Math.min(1, x / rect.width));
        const normY = Math.max(0, Math.min(1, y / rect.height));

        const px = normX * canvas.width;
        const py = normY * canvas.height;

        // Provide both pixel-space and normalized mouse uniforms.
        // - `u_mouse` is in canvas pixel space (matches `u_resolution`).
        // - `u_mousePx` is an explicit alias for pixel space.
        // - `u_mouse01` is normalized (0..1) for docs examples.
        setUniformVec2(glslCanvas, 'u_mouse', px, py);
        setUniformVec2(glslCanvas, 'u_mousePx', px, py);
        setUniformVec2(glslCanvas, 'u_mouse01', normX, normY);

        if (isMouseDown) {
            const deltaX = (x - lastX) / rect.width;
            const deltaY = (y - lastY) / rect.height;

            setUniformVec2(glslCanvas, 'u_mouseDelta', deltaX, deltaY);
        }

        lastX = x;
        lastY = y;

        if (!glslCanvas.__mdocHasRenderLoop) {
            requestRender(glslCanvas);
        }
    }

    canvas.style.touchAction = 'none';

    // We listen to both PointerEvents and MouseEvents:
    // - glslCanvas itself listens to mouse events in some builds; we want to override uniforms after that.
    // - PointerEvents improve touch/stylus support.
    if (window.PointerEvent) {
        canvas.addEventListener('pointerdown', function(e) {
            if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
            canvas.setPointerCapture(e.pointerId);
            updateMouse(e);
            setMouseDown(true);
        }, true);

        canvas.addEventListener('pointerup', function(e) {
            if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
            try {
                canvas.releasePointerCapture(e.pointerId);
            } catch (err) {
                // noop
            }
            setMouseDown(false);
        }, true);

        canvas.addEventListener('pointermove', updateMouse, true);

        canvas.addEventListener('pointerleave', function(e) {
            if (e && typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
            setMouseDown(false);
        }, true);
    }

    canvas.addEventListener('mousedown', function(e) {
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        updateMouse(e);
        setMouseDown(true);
    }, true);

    canvas.addEventListener('mouseup', function(e) {
        if (e && typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        setMouseDown(false);
    }, true);

    canvas.addEventListener('mousemove', updateMouse, true);

    canvas.addEventListener('mouseleave', function(e) {
        if (e && typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        setMouseDown(false);
    }, true);

    // Initialize default uniform values
    setUniformVec2(glslCanvas, 'u_mouse', canvas.width * 0.5, canvas.height * 0.5);
    setUniformVec2(glslCanvas, 'u_mousePx', canvas.width * 0.5, canvas.height * 0.5);
    setUniformVec2(glslCanvas, 'u_mouse01', 0.5, 0.5);
    setMouseDown(false);
    setUniformVec2(glslCanvas, 'u_mouseDelta', 0.0, 0.0);
}

function requestRender(glslCanvas) {
    if (!glslCanvas || typeof glslCanvas.render !== 'function') return;
    if (glslCanvas.__mdocHasRenderLoop) return;
    if (glslCanvas.__mdocRenderQueued) return;
    glslCanvas.__mdocRenderQueued = true;
    requestAnimationFrame(() => {
        glslCanvas.__mdocRenderQueued = false;
        glslCanvas.render();
    });
}

function startAnimationLoopIfNeeded(glslCanvas, shaderCode) {
    if (!glslCanvas) return;
    if (glslCanvas.__mdocHasRenderLoop) return;
    if (glslCanvas.__mdocAnimationLoopStarted) return;

    const usesTime = /\bu_time\b/.test(shaderCode);
    if (!usesTime) return;

    glslCanvas.__mdocAnimationLoopStarted = true;
    const start = performance.now();

    function tick() {
        if (glslCanvas.__mdocHasRenderLoop) return;
        const t = (performance.now() - start) / 1000;
        setUniformFloat(glslCanvas, 'u_time', t);
        glslCanvas.render();
        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

function setUniformFloat(glslCanvas, name, value) {
    if (!glslCanvas) return;
    if (typeof glslCanvas.setUniform === 'function') {
        try {
            glslCanvas.setUniform(name, value);
            return;
        } catch (err) {
            // fallthrough
        }
    }
    if (glslCanvas.uniforms) {
        glslCanvas.uniforms[name] = { type: 'f', value };
    }
}

function setUniformVec2(glslCanvas, name, x, y) {
    if (!glslCanvas) return;
    if (typeof glslCanvas.setUniform === 'function') {
        try {
            glslCanvas.setUniform(name, x, y);
            return;
        } catch (err) {
            // fallthrough
        }
        try {
            glslCanvas.setUniform(name, [x, y]);
            return;
        } catch (err) {
            // fallthrough
        }
    }
    if (glslCanvas.uniforms) {
        glslCanvas.uniforms[name] = { type: 'vec2', value: [x, y] };
    }
}

function setupPerformanceMonitor(infoDiv, glslCanvas) {
    if (!infoDiv) return;

    const fpsCounter = infoDiv.querySelector('.fps');
    const timeInfo = infoDiv.querySelector('.time');

    if (!fpsCounter || !timeInfo) return;

    let lastTime = performance.now();
    let frames = 0;

    function updateInfo() {
        const now = performance.now();
        frames++;

        if (now - lastTime >= 1000) {
            fpsCounter.textContent = `FPS: ${frames}`;
            frames = 0;
            lastTime = now;
        }

        if (glslCanvas.uniforms && glslCanvas.uniforms.u_time) {
            const shaderTime = glslCanvas.uniforms.u_time.value;
            if (typeof shaderTime === 'number') {
                timeInfo.textContent = `Time: ${shaderTime.toFixed(1)}s`;
            }
        }

        requestAnimationFrame(updateInfo);
    }

    requestAnimationFrame(updateInfo);
}
