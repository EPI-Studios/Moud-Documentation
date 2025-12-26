# Rendering 
Client-side rendering helpers backed by Foundry Veil.

This API is only available on clients running the Moud Fabric mod.

Everything here lives under `Moud.rendering`.

## Animation Frame

### requestAnimationFrame / cancelAnimationFrame

```ts
requestAnimationFrame(callback: (deltaMs: number) => void): string
cancelAnimationFrame(id: string): void
```

Runs `callback` on the next render tick.

* **Example**:

```ts
const id = Moud.rendering.requestAnimationFrame((dt) => {
    console.log("Frame time (ms)", dt);
});

Moud.rendering.cancelAnimationFrame(id);
```

## Framebuffers (FBO)

### createFramebuffer / removeFramebuffer

```ts
createFramebuffer(framebufferId: string, options?: ClientFramebufferOptions): void
removeFramebuffer(framebufferId: string): void
```

`framebufferId` must be a valid Minecraft id like `moud:minimap`.

Common options:

- `scale`: render at a fraction of the screen size (default: `1`)
- `width` / `height`: fixed resolution (overrides `scale`)
- `depth`: `true` to add a depth attachment (or a full attachment object)
- `autoClear` and `clearColor` (clears once per frame)

Color attachments (advanced):

- `colorBuffers` / `color_buffers`: an array of attachments
- `color`: single attachment or array (convenience)

Each attachment can define:

- `type`: `'texture' | 'render_buffer'` (default: `'texture'`)
- `format`: Veil format name like `RGBA8`, `RGB16F`, `DEPTH_COMPONENT`
- `levels`: mip levels / samples (default: `1`)
- `linear`: linear filtering for texture attachments
- `name`: optional alias (exposed to shaders as a sampler uniform)

* **Example**:

```ts
Moud.rendering.createFramebuffer("moud:minimap", { scale: 0.5, depth: true });
```

* **Example (named color attachment)**:

```ts
Moud.rendering.createFramebuffer("moud:scene_color", {
    width: 1280,
    height: 720,
    autoClear: true,
    clearColor: { r: 0, g: 0, b: 0, a: 1, depth: 1 },
    colorBuffers: [{ format: "RGBA16F", name: "SceneColor", linear: true }],
    depth: true,
});
```

## Render Passes

### defineRenderPass / removeRenderPass / setRenderPassEnabled

```ts
defineRenderPass(passId: string, pass: ClientRenderPassOptions): void
removeRenderPass(passId: string): void
setRenderPassEnabled(passId: string, enabled: boolean): void
```

All passes support:

- `stage?: string` — render stage to execute at (defaults to `after_level`)
- `order?: number` — lower runs earlier within a stage
- `enabled?: boolean`

Pass types (`pass.type`):

- `world`: renders the world into `out`
- `blit`: full-screen shader pass from `in` to `out`
- `copy`: copies attachments between framebuffers (no shader)
- `clear`: clears a framebuffer

* **Example (world pass)**:

```ts
Moud.rendering.defineRenderPass("minimap_world", {
    type: "world",
    stage: "after_level",
    out: "moud:minimap",
    camera: {
        position: { x: 0, y: 120, z: 0 },
        lookAt: { x: 0, y: 64, z: 0 }
    },
    fov: 70,
    clear: true
});
```

### Stages

Built-in stages include:

- `after_sky`
- `after_solid_blocks`
- `after_cutout_mipped_blocks`
- `after_cutout_blocks`
- `after_entities`
- `after_block_entities`
- `after_translucent_blocks`
- `after_tripwire_blocks`
- `after_particles`
- `after_weather`
- `after_level`

### Pass specifics

**Blit**

```ts
Moud.rendering.defineRenderPass("bloom_blit", {
    type: "blit",
    stage: "after_level",
    shader: "moud:shaders/bloom",
    in: "moud:scene_color",
    out: "moud:scene_color",
    uniforms: {
        threshold: 1.0,
        intensity: 0.6,
        tint: { r: 1, g: 0.9, b: 1.0 },
    },
});
```

Uniform values can be `number`, `boolean`, `Vector3`, `Quaternion`, arrays, and `clearColor`-like objects.

**Copy**

```ts
Moud.rendering.defineRenderPass("copy_depth", {
    type: "copy",
    stage: "after_level",
    in: "moud:scene_color",
    out: "moud:minimap",
    depth: true,
});
```

**Clear**

```ts
Moud.rendering.defineRenderPass("clear_minimap", {
    type: "clear",
    stage: "after_level",
    target: "moud:minimap",
    clearColor: { r: 0, g: 0, b: 0, a: 0, depth: 1 },
});
```

## Using a Framebuffer as a Texture

Framebuffers can be exposed as a normal Minecraft texture id:

`moud:fbo/<namespace>/<path>`

If your framebuffer id is `moud:minimap`, the exported texture id is `moud:fbo/moud/minimap`.

This is mainly used with world displays:

```ts
// server script
api.world.createDisplay({
    position: api.math.vector3(0.5, 66, 0.5),
    content: { type: "texture", source: "moud:fbo/moud/minimap" }
});
```

Each client resolves `moud:fbo/...` to its own framebuffer texture.

The SDK also includes a helper:

```ts
const texId = framebufferExportTextureId("moud:minimap");
```

## Custom Render Types

### createRenderType / setShaderUniform

```ts
createRenderType(options: RenderTypeOptions): string
setShaderUniform(shaderId: string, uniformName: string, value: number | boolean): void
```

Creates a render type backed by a custom shader program, and lets you update uniforms.

`RenderTypeOptions`:

- `shader: string` (required)
- `textures?: string[]`
- `transparency?: string` (defaults to `opaque`)
- `cull?: boolean` (defaults to `true`)
- `lightmap?: boolean`
- `depthTest?: boolean` (defaults to `true`)

* **Example**:

```ts
const renderTypeId = Moud.rendering.createRenderType({
    shader: "moud:shaders/hologram",
    textures: ["moud:textures/hologram.png"],
    transparency: "translucent",
    cull: false,
    depthTest: true,
});

Moud.rendering.setShaderUniform(renderTypeId, "time", performance.now());
```
