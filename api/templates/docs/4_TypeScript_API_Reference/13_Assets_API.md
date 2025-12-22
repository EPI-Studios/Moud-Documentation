# Assets 

`api.assets` loads files from your datapack’s `assets/<namespace>/...` directory.

The important part: you pass a **namespaced asset id** (example: `moud:shaders/example.glsl`), and you get back either an asset proxy (shader/texture/data) or a raw string (`loadText`).

## loadShader

```ts
const shader = api.assets.loadShader('moud:shaders/example.glsl');

shader.getId();   // string
shader.getCode(); // string (GLSL source)
```

## loadTexture

```ts
const tex = api.assets.loadTexture('moud:textures/ui/button.png');

tex.getId();   // string
tex.getData(); // number[] (raw bytes)
```

## loadData

`loadData` is for JSON/text payloads where you still want the asset id:

```ts
const cfg = api.assets.loadData('moud:data/config.json');

const json = cfg.getContent();
const parsed = JSON.parse(json);
```

## loadText

`loadText` is the “just give me the file content” version:

```ts
const motd = api.assets.loadText('moud:data/motd.txt');
api.server.broadcast(motd);
```
