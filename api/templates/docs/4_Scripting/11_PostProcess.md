# Post-Processing API

The `PostProcess` global interface allows client scripts to register and evaluate fullscreen fragment shaders following the primary 3D render pass. Registered effects are scoped to the executing script instance and automatically deallocate when the script context unloads.

---

## API reference

### Registration methods

| Method | Description |
|---|---|
| `register(id: string, fragSrc: string)` | Registers an inline fragment shader string with a default priority of `0`. |
| `registerPriority(id: string, fragSrc: string, priority: int)` | Registers an inline fragment shader string with an explicit execution priority integer. |
| `registerShader(id: string, shaderPath: string)` | Registers a compiled `.moudshader` asset path. |
| `registerShaderPriority(id: string, shaderPath: string, priority: int)` | Registers a compiled `.moudshader` asset with an explicit execution priority integer. |
| `unregister(id: string)` | Deallocates the specified effect from the active render pipeline. |
| `has(id: string)` | Evaluates to `true` if an effect with the specified identifier is actively registered. |

### Internal render scale

Controls the internal resolution of the post-processing execution pass. The 3D scene renders at the native framebuffer resolution, while the post-processing ping/pong buffers evaluate at the specified scale. The final output is nearest-neighbor upscaled to the viewport dimensions.

| Method | Description |
|---|---|
| `setRenderScale(scale: float)` | Sets the global render scale for all post-process passes. Clamped to `[0.05, 1.0]`. A value of `1.0` disables scaling. |
| `getRenderScale()` | Returns the currently configured scale multiplier. |

**Pipeline behavior when `scale < 1.0`:**

1. The native scene framebuffer is downsampled into the execution buffer utilizing a `LINEAR` filter to mitigate high-frequency aliasing.
2. Registered post-process passes evaluate at `Resolution = window × scale`. The shader-visible uniforms `Resolution`, `TexelSize`, and `AspectRatio` reflect these scaled dimensions.
3. Ping-pong color textures utilize `NEAREST` filtering, ensuring pixel-perfect `texture(screen, uv)` sampling across intra-pass executions.
4. Following the final pass, the scaled buffer is blitted back to the main framebuffer utilizing `GL_NEAREST`.

**Render scale reference:**

| Scale | Viewport translation (1080p base) |
|---|---|
| `1.0` | 1920×1080 (Native execution) |
| `0.5` | 960×540 |
| `0.25` | 480×270 |
| `0.15` | 288×162 |
| `0.08` | 153×86 |

### Uniform assignment

Modifies shader uniform variables during the active render frame.

| Method | GLSL Type | Description |
|---|---|---|
| `setUniform1(id: string, key: string, v: float)` | `float` | Assigns a single float value. |
| `setUniform2(id: string, key: string, x: float, y: float)` | `vec2` | Assigns a 2D vector. |
| `setUniform3(id: string, key: string, x: float, y: float, z: float)` | `vec3` | Assigns a 3D vector. |
| `setUniform4(id: string, key: string, x: float, y: float, z: float, w: float)` | `vec4` | Assigns a 4D vector. |
| `setUniformTexture(id: string, key: string, texturePath: string)` | `sampler2D` | Binds a texture sampler from a designated asset path. |

---

## Execution order

The render pipeline sorts effects by their `priority` integer prior to execution.

*   Lower priority values execute earlier in the render chain.
*   Higher priority values execute later, compounding over preceding buffer outputs.
*   If multiple effects share an identical priority integer, execution evaluates by registration sequence.

Registering an existing `id` overwrites the prior effect and updates its priority evaluation in the chain.

---

## Shader environment

The pipeline automatically injects a standardized header into all registered post-process fragment shaders. Do not redeclare the following built-in inputs or outputs within the shader source.

### Built-in inputs

| Identifier | Type | Description |
|---|---|---|
| `texCoord` | `vec2` | Fullscreen UV coordinates. |
| `vTexCoord` | `vec2` | Alias for `texCoord`. |
| `screen` | `sampler2D` | The compiled scene color buffer, or the output buffer of the preceding post-process effect. |
| `depth` | `sampler2D` | The primary scene depth buffer texture. |
| `Resolution` | `vec2` | The output viewport dimensions in pixels. |
| `TexelSize` | `vec2` | The normalized pixel dimensions (`1.0 / Resolution`). |
| `AspectRatio` | `float` | The viewport aspect ratio (`Resolution.x / Resolution.y`). |
| `Time` | `float` | The elapsed time in seconds since the post-processing service initialized. |
| `DeltaTime` | `float` | The elapsed time in seconds since the previous render frame. |
| `DepthAvailable` | `int` | Evaluates to `1` if a valid depth texture is bound; otherwise `0`. |

### Built-in outputs

| Identifier | Type | Description |
|---|---|---|
| `fragColor` | `vec4` | The final RGBA fragment evaluation output. |

---

## Implementation examples

### Inline fragment shader
Evaluates a procedural noise effect utilizing an inline GLSL string.

```lua
local script = {}

local GRAIN_SRC = [[
uniform float strength;

float hash(vec2 p) {
    p = fract(p * vec2(443.897, 441.423));
    p += dot(p, p.yx + 19.19);
    return fract((p.x + p.y) * p.x);
}

void main() {
    vec2 uv = vTexCoord;
    vec4 color = texture(screen, uv);
    float grain = hash(uv * Resolution + Time * 1000.0) - 0.5;
    fragColor = vec4(color.rgb + grain * strength, color.a);
}
]]

function script.onReady()
    PostProcess.registerPriority("grain", GRAIN_SRC, 30)
    PostProcess.setUniform1("grain", "strength", 0.05)
end

return script
```

### Asset-based shader
Registers a compiled `.moudshader` asset requiring scene depth evaluation.

**`assets/shaders/depth_fog.moudshader`**
```glsl
uniform vec3 fogColor;
uniform float fogStrength;

void main() {
    vec2 uv = vTexCoord;
    vec4 color = texture(screen, uv);
    float d = DepthAvailable != 0 ? texture(depth, uv).r : 1.0;
    float fog = clamp(d * fogStrength, 0.0, 1.0);
    fragColor = vec4(mix(color.rgb, fogColor, fog), color.a);
}
```

**Client script (`.luau`)**
```lua
local script = {}

function script.onReady()
    PostProcess.registerShaderPriority("depth_fog", "res://shaders/depth_fog.moudshader", 20)
    PostProcess.setUniform3("depth_fog", "fogColor", 0.45, 0.55, 0.7)
    PostProcess.setUniform1("depth_fog", "fogStrength", 1.35)
end

return script
```

### Render scale manipulation
To achieve a low-resolution viewport upscale, apply a minimal passthrough shader combined with a reduced render scale. A registered effect is strictly required to route the scene through the scaled framebuffer.

```lua
local script = {}

local PASSTHROUGH = [[
void main() {
    fragColor = texture(screen, vTexCoord);
}
]]

function script.onReady()
    PostProcess.register("pixel_art", PASSTHROUGH)
    PostProcess.setRenderScale(0.25)
end

return script
```

---

## Execution lifecycle

The engine automatically deallocates registered effects when the instantiating script unloads. Manual deallocation via `PostProcess.unregister()` is only necessary to terminate an effect while the script remains actively executing.

---

## PostProcess Node

The `PostProcess` node allows scene-based configuration of fullscreen effects without executing script logic.

| Property | Type | Description |
|---|---|---|
| `source` | string | Shader asset path (e.g., `res://shaders/bloom.moudshader`). |
| `enabled` | bool | Evaluates the effect within the render chain when `true`. |
| `priority` | int | Execution priority integer. |
| `uniforms` | string | Semicolon-separated scalar/vec2/vec3/vec4 uniform definitions (`key=value; key=x,y,z;`). |

The engine evaluates enabled `PostProcess` nodes per frame and synchronizes them to the `PostProcessService`. Disabling or removing the node unregisters the associated effect.

---

## Scene lights and camera integration

Post-processing shaders automatically receive scene light data and camera matrices via the injected engine header. Scripts do not need to pass these uniforms manually.

```glsl
struct MoudPointLight { vec3 position; vec3 color; float brightness; float radius; };
struct MoudDirLight   { vec3 direction; vec3 color; float brightness; };
struct MoudSpotLight  { vec3 position; vec3 direction; vec3 color; float brightness; float angle; float distance; };

uniform int NumPointLights;
uniform MoudPointLight PointLights[16];
uniform int NumDirLights;
uniform MoudDirLight DirLights[4];
uniform int NumSpotLights;
uniform MoudSpotLight SpotLights[8];

uniform mat4 moud_viewProj;
uniform mat4 moud_invViewProj;
uniform vec3 moud_cameraPos;
```

---

