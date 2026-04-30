# PostProcess

The `PostProcess` node applies custom fragment shaders to the rendered viewport. The engine evaluates these shaders after primary geometry rendering, allowing them to sample the composited framebuffer and world depth buffer before final visual output. The system automatically manages shader compilation, uniform allocation, ping-pong buffering, render-scale downsampling, and execution timing.

---

## Configuration

Post-process effects are instantiated as nodes within the scene graph. Multiple `PostProcess` nodes can execute simultaneously; the engine evaluates them sequentially based on their `priority` integer, passing the output of the preceding pass as the input texture for the subsequent pass.

```json
{
  "type": "PostProcess",
  "name": "VolumetricFog",
  "properties": {
    "source":   "res://shaders/volumetric_fog.moudshader",
    "enabled":  "true",
    "priority": "40",
    "stage":    "world",
    "uniforms": "fog_color=0.96,0.97,1.00; fog_top=140; fog_density=0.06"
  }
}
```

| Property | Type | Description |
|---|---|---|
| `source` | string | The absolute asset path (`res://`) to the `.moudshader` fragment file. |
| `enabled` | bool | Determines whether the engine evaluates the shader during the render pass. |
| `priority` | int | Execution sorting index. Effects within the same stage evaluate in ascending priority order. |
| `stage` | string | Defines the render pipeline execution point (`"world"` or `"screen"`). Defaults to `"world"`. |
| `uniforms` | string | Semi-colon separated key-value pairs allocated to the shader at runtime. |

---

## Execution stages

The `stage` property strictly defines when the fragment shader evaluates within the frame cycle. 

| Stage | Execution point | Buffer access | Common implementations |
|---|---|---|---|
| `world` | Evaluates after 3D world geometry, before the viewmodel and HUD/UI overlay. | World geometry, skybox, and the live world depth buffer. | Volumetric fog, atmospheric scattering, god rays, screen-space ambient occlusion (SSAO). |
| `screen` | Evaluates immediately before the framebuffer flip, after all HUD/UI rendering concludes. | The fully composited frame (World + Viewmodel + UI). | Pixelation, dithering, global color grading, screen shake. |

```hint warning Depth buffer availability
The `screen` stage executes after UI compositing, meaning the world depth buffer is no longer available. Depth-dependent shaders (e.g., volumetric fog) must be assigned to the `world` stage. Assigning them to `screen` will result in visual artifacts, such as fog overlapping UI elements.
```

---

## Built-in shader inputs

The engine automatically prepends a standardized variable header to all `.moudshader` files evaluated by a `PostProcess` node. This exposes the viewport buffers, camera matrices, and scene lighting parameters directly to the fragment program.

**Core buffers and matrices:**
```glsl
in  vec2  texCoord;          // Standardized as the macro vTexCoord
out vec4  fragColor;

uniform sampler2D screen;     // Color input from the previous pass
uniform sampler2D depth;      // World depth buffer (restricted to 'world' stage)
uniform vec2  Resolution;
uniform vec2  TexelSize;
uniform float AspectRatio;
uniform float Time;           // Time since engine startup in seconds
uniform float DeltaTime;
uniform int   DepthAvailable; // Evaluates to 0 if depth is unbound

uniform mat4 moud_viewProj;
uniform mat4 moud_invViewProj;
uniform mat4 moud_invProj;
uniform mat4 moud_invView;
uniform vec3 moud_cameraPos;
```

**Scene lighting arrays:**
```glsl
uniform int        NumPointLights;
uniform PointLight PointLights[16];
uniform int        NumDirLights;
uniform DirLight   DirLights[4];
uniform int        NumSpotLights;
uniform SpotLight  SpotLights[8];
```

---

## Shader helper libraries

The Veil rendering framework exposes five internal GLSL utility libraries. These are imported using the `#include moud:<name>` preprocessor directive and contain optimized logic for rendering mathematics.

| Library | Functionality |
|---|---|
| `moud:camera` | `worldFromUv(uv, depth)`, `viewDirFromUv(uv)`, `cameraRayFromUv(...)` - Computes world-space ray reconstruction from viewport coordinates. |
| `moud:noise` | `hash12`, `hash22`, `vnoise`, `worley`, `fbm2/3/4`, `domainWarp` - Hash-based procedural noise generation without texture sampling overhead. |
| `moud:volume` | `slabIntersect(origin, dir, yMin, yMax, maxT)`, `verticalBell(...)`, `verticalAnvil(...)`, `exponentialFalloff(...)` - Boundary intersection evaluation. |
| `moud:lighting` | `phaseHG(...)`, `attenuationPoint`, `sceneInScattering(...)` - Lighting calculation algorithms summing global illumination arrays. |
| `moud:volumetric` | `beerLambertStep(...)`, `compositeOverScene(...)` - Integration logic for front-to-back raymarching accumulation. |

**Example implementation:**
The following shader demonstrates volumetric raymarching using the built-in utility libraries.

```glsl
#include moud:camera
#include moud:noise
#include moud:volume
#include moud:volumetric
#include moud:lighting

uniform vec3  fog_color;
uniform float fog_top;
uniform float fog_bottom;
uniform float fog_density;
uniform float fog_scale;

void main() {
    vec3  origin   = VeilCamera.CameraPosition;
    vec3  rayDir   = viewDirFromUv(vTexCoord);
    float depthVal = texture(depth, vTexCoord).r;
    bool  isSky    = depthVal >= 0.9999;
    float sceneT   = isSky ? 1e6 : distance(origin, worldFromUv(vTexCoord, depthVal));

    vec2 hit = slabIntersect(origin, rayDir, fog_bottom, fog_top, sceneT);
    if (hit.y <= hit.x) {
        fragColor = texture(screen, vTexCoord);
        return;
    }

    float stepLen = (hit.y - hit.x) / 24.0;
    float trans   = 1.0;
    vec3  cloud   = vec3(0.0);

    for (int i = 0; i < 24; i++) {
        float t = hit.x + (float(i) + 0.5) * stepLen;
        vec3  p = origin + rayDir * t;

        float n     = fbm3(p.xz / fog_scale + Time * vec2(0.4, 0.0));
        float dens  = smoothstep(0.4, 0.7, n) * verticalAnvil(p.y, fog_bottom, fog_top);
        if (dens <= 0.0) continue;

        vec3 lit = sceneInScattering(p, rayDir, 0.5);
        beerLambertStep(trans, cloud, dens * fog_density, stepLen, lit);
        if (trans < 0.01) break;
    }

    vec3 base = texture(screen, vTexCoord).rgb;
    fragColor = vec4(compositeOverScene(cloud, trans, base), 1.0);
}
```

---

## Runtime script execution

Post-process pipelines can be explicitly registered, modified, and terminated via the global `PostProcess` scripting API. These functions execute entirely on the local client.

```lua
-- Instantiate a procedural post-process shader
PostProcess:registerShaderPriority("clouds", "res://shaders/clouds.moudshader", 40)

-- Update shader uniforms
PostProcess:setUniform1("clouds", "fog_density", 0.06)
PostProcess:setUniform3("clouds", "fog_color", 0.96, 0.97, 1.00)

-- Modify the internal render scale resolution
PostProcess:setRenderScale(0.5) 

-- Terminate the shader pass
PostProcess:unregister("clouds")
```

The `setRenderScale` parameter applies a resolution downsample to the source frame prior to shader evaluation. For `world`-stage effects, the engine automatically upscales the resulting output before rendering the UI/HUD, preserving native resolution for 2D interface elements.

---

## Uniform parsing

The `uniforms` property on a `PostProcess` node evaluates a string array into GLSL uniforms. The parser adheres to the following structural rules:

*   Semicolons (`;`) separate independent uniform bindings.
*   Equals signs (`=`) map scalar or vector values to a specified key.
*   Commas (`,`) delimit vector components. Float sequences of length 1, 2, 3, and 4 correlate strictly to `float`, `vec2`, `vec3`, and `vec4` GLSL types respectively.
*   The parser silently discards invalid syntax formatting and unregistered shader keys.

**Evaluation example:**
```text
fog_color=0.96,0.97,1.00; fog_top=140; fog_wind=0.4,0.15
```

**Resulting GLSL allocation:**
```glsl
uniform vec3 fog_color;  // (0.96, 0.97, 1.00)
uniform float fog_top;   // 140.0
uniform vec2 fog_wind;   // (0.4, 0.15)
```

---

## See Also

| Topic | Link |
|---|---|
| Lighting | [Light and Environment Nodes](/5_Project_Reference/06_Light_and_Environment_Nodes) |
| Render architecture | [3D Rendering](/4_Scripting/07_Rendering) |
| Asset pipelines | [Resources](/1_Getting_Started/4_Resources) |