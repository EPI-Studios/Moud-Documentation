# Project Layout & Configuration

The CLI scaffolds every project with the same layout so both the Java server and Fabric client know where to find scripts, assets, and metadata.

```
my-game/
├─ src/                 # Server scripts (executed by Graal on the Minestom server)
├─ client/              # Optional client-only scripts (run inside the Fabric mod)
├─ assets/              # Textures, models, shaders, sounds packaged and sent to clients
├─ package.json         # Project manifest and entry point
├─ tsconfig.json        # TypeScript compiler options (shared by server/client scripts)
├─ .moud/               # CLI cache: transpiled bundles, manifest, temp build artifacts
├─ dist/                # Created by `moud pack` (zip ready for distribution)
└─ node_modules/
```

## package.json

`moud:main` is the only required Moud-specific field—it points at the server entry point the engine should execute. Everything else follows standard Node conventions.

```jsonc
{
  "name": "my-supra-banger-game",
  "description": "A Moud game",
  "version": "0.1.0",
  "type": "module",
  "moud:main": "src/main.ts",
  "scripts": {
    "dev": "moud dev --watch",
    "build": "moud pack"
  },
  "devDependencies": {
    "@epi-studio/moud-sdk": "^0.2.0",
    "@epi-studio/moud-cli": "^0.2.0",
    "typescript": "^5.5.0"
  }
}
```

| Field | Purpose |
| --- | --- |
| `name` | Used when packaging (`dist/<name>-v<version>.zip`). |
| `moud:main` | Server entry point. Can point to `.ts`, `.tsx`, `.js`, `.mjs`, `.cjs`. |
| `scripts.dev` | Wraps `moud dev`. Pass CLI flags after `--`. |
| `scripts.build` | Runs the packer (`moud pack`). |
| `devDependencies` | Tooling only: CLI, SDK typings, TypeScript. The SDK ships types for `api`, `Player`, `Vector3`, `Moud.ui`, etc. |

```hint warning Keep the SDK updated
`@epi-studio/moud-sdk` is type-only but it must match the engine build to expose the latest APIs (lighting, cursor, audio, etc.). Update it whenever you bump the CLI/server.
```

## TypeScript Compiler Settings

`tsconfig.json` is generated with sensible defaults:

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "types": ["@epi-studio/moud-sdk"],
    "skipLibCheck": true,
    "strict": true,
    "outDir": ".moud/.tmp"
  },
  "include": ["src", "client"]
}
```

- The SDK registers global types (`api`, `Moud`, `Player`, `Vector3`, etc.) so you rarely import them manually.
- Both `src/` and `client/` share the same compiler options. Client bundles are tree-shaken and zipped by the CLI.

## Runtime Configuration

Most runtime tweaks happen via CLI flags:

| Command | Flags | Description |
| --- | --- | --- |
| `moud dev --port 25570` | `--port` | Changes the exposed TCP port (default 25565). |
| `moud dev --online-mode true` | `--online-mode` | Enables Mojang authentication. |
| `moud dev --no-watch` | `--watch/--no-watch` | Enables/disables chokidar file watching + hot reload. |
| `moud pack` | (implicit) | Uses esbuild minification and produces `dist/`. |

While the server runs it stores transpiled bundles in `.moud/cache`. The manifest contains the last hash, so the CLI only rebuilds when sources change. You can safely delete `.moud` to force a clean build.

## Assets & Client Bundles

- Place textures/models/shaders/sounds under `assets/<namespace>/...`. The `AssetManager` detects file types automatically (`png/jpg → texture`, `obj/gltf → model`, `glsl → shader`, etc.).
- Client-only scripts live in `client/`. Every `.ts/.js` file there is bundled (with sourcemaps in dev) and zipped into `client.bundle`. The server streams that bundle to the Fabric mod at connect time.
- Player animation JSON (`*.animation.json`) is automatically repathed to `assets/<namespace>/player_animations/` so PlayerAnimationLib can use it propely.

With these conventions in place, the rest of the documentation focuses on writing actual gameplay code without touching build plumbing.
