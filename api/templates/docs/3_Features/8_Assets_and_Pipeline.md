# Assets, Bundles & Tooling Pipeline

Moud’s tooling automates everything between your TypeScript source and the running server/client: compiling scripts, packaging assets, streaming client bundles, and hot reloading. 

## Directory Conventions

```
project/
├─ src/          # Server scripts (TS/JS)
├─ client/       # Optional client-only scripts (TS/JS)
├─ assets/       # Textures, models, shaders, sounds, animation JSON, data files
├─ .moud/        # CLI cache: server bundle, client bundle, manifest, scene etc
└─ dist/         # Created by `moud pack`
```

### Asset IDs

`AssetDiscovery` walks `assets/` and derives IDs automatically:

| Extension | Type | Example usage |
| --- | --- | --- |
| `.png`, `.jpg` | Texture | `api.world.createDisplay({ content: { type: 'image', source: 'moud:textures/logo.png' }})` |
| `.obj` | Model | `api.world.createModel({ model: 'moud:models/capsule.obj' })` |
| `.glsl`, `.vert`, `.frag` | Shader | `api.assets.loadShader('moud:shaders/outline.frag')` |
| `.ogg` | Sound | `player.getAudio().play({ id: 'sfx:door', sound: 'moud:sfx/door' })` |
| `.json` | Data (or animations) | PlayerAnimation files are repathed automatically. |

IDs follow `namespace:path`. The namespace is the folder directly under `assets/`.

## Transpilation & Bundling

`moud dev` invokes the `Transpiler`:

1. Reads `package.json["moud:main"]` to find the server entry point.
2. Runs esbuild (ES2022, ESM) and writes the result to `.moud/cache/server.bundle.js`.
3. Recursively bundles every file in `client/`. Each TS/JS file becomes a module under `scripts/<path>.js` inside a zip buffer.
4. Computes a SHA-256 hash over the server text + client buffer and writes `.moud/cache/manifest.json`.

Hot reload uses the manifest: if you haven’t touched the entry point or client files, successive runs reuse the cached bundles.

## Streaming to Clients

When a player joins:

1. `ClientScriptManager` ensures `client.bundle` is available (either from cache or by rebuilding).
2. `ServerNetworkManager` sends the bundle hash to the client.
3. If the client already has that hash cached, it only loads metadata; otherwise it downloads the entire bundle.
4. Once the Fabric mod reports `ClientReady`, systems like lighting, shared values, and displays resync.

## Asset Proxy on the Server

Access assets at runtime without touching the filesystem:

```ts
const shader = api.assets.loadShader('moud:shaders/postprocess.frag');
const data = JSON.parse(api.assets.loadData('moud:data/dialogue.json').getContent());
```

`AssetManager` caches loaded files in memory, so repeated calls are cheap.


## Hot Reload Endpoint

The Java server exposes `http://localhost:<port+1000>/moud/api/reload`. `moud dev --watch` compiles new bundles and `POST`s them there. Inside the server:

- `HotReloadEndpoint` hands the new bundles to `MoudEngine.reloadUserScripts`.
- The old `JavaScriptRuntime` shuts down, assets refresh, the new runtime boots, and scripts execute. All of this happens asynchronously, so players stay connected.

If the reload fails, the CLI prints a warning and you can restart manually.
