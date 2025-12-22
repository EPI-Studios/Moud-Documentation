# Rendering 
Client-side rendering helpers backed by Foundry Veil.

This API is only available on clients running the Moud Fabric mod.

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

Options:

- `scale`: render at a fraction of the screen size (default: `1`)
- `width` / `height`: fixed resolution (overrides `scale`)
- `depth`: `true` to add a depth attachment
- `autoClear` and `clearColor`

* **Example**:

```ts
Moud.rendering.createFramebuffer("moud:minimap", { scale: 0.5, depth: true });
```

## Render Passes

### defineRenderPass / removeRenderPass / setRenderPassEnabled

```ts
defineRenderPass(passId: string, pass: ClientRenderPassOptions): void
removeRenderPass(passId: string): void
setRenderPassEnabled(passId: string, enabled: boolean): void
```

Pass types:

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

## Custom Render Types

### createRenderType / setShaderUniform

```ts
createRenderType(options: RenderTypeOptions): string
setShaderUniform(shaderId: string, uniformName: string, value: number | boolean): void
```

Creates a render type backed by a custom shader program, and lets you update uniforms.

