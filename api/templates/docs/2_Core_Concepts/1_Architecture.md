# Architecture

Moud is a TypeScript-first workflow built around a Minestom server and a Fabric client mod.

You write:

- server scripts (executed by the server)
- optional client scripts (executed by the client mod)
- assets (textures, shaders, sounds, data)

The CLI bundles scripts and the server streams assets and client scripts to players.

```

┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ CLI + SDK    │    │ Minestom Server  │    │ Fabric Client Mod │
│ (Node.js)    │ -> │ + GraalVM (api)  │ -> │ + GraalVM (Moud)  │
└──────────────┘    └──────────────────┘    └──────────────────┘
│                    │                      │
└── assets + bundle ─┴──── custom packets ───┘

```

## What runs where

- Server scripts run with the `api` global (server-only).
- Client scripts run with the `Moud` global (client-only).
- There is no `api` global on the client.

Server scripts have timer helpers like `setTimeout` and `setInterval`. Client-side rendering timers like `requestAnimationFrame` are client-only.

## Tooling (CLI + SDK)

### CLI (`packages/moud-cli`)

- Commands: `moud create`, `moud dev`, `moud pack`.
- Ensures a working environment:
  - installs Java 21 under `~/.moud/jdks/` (if needed)
  - downloads a compatible server jar under `~/.moud/servers/`
- Bundles your project into cached artifacts:
  - `.moud/cache/server.bundle.js`
  - `.moud/cache/client.bundle`
  - `.moud/cache/manifest.json`
- In watch mode, it sends new bundles to the hot reload endpoint (`/moud/api/reload` on `port + 1000`).

### SDK (`packages/sdk`)

`packages/sdk` is an npm package used by TypeScript projects. It provides:

- the TypeScript API surface for `api` and `Moud` (autocomplete and type safety)
- a small set of runtime helpers used by scripts (example: `framebufferExportTextureId`)

## Server Runtime (`server/`)

The server is a standalone Minestom distribution (entry point `com.moud.App`). It is not a Spigot or Bukkit plugin.

At startup it:

- loads the project root (looks for `package.json` and `moud:main`)
- starts the scripting runtime (GraalVM) and exposes `api` as a proxy surface
- builds and hosts the resource pack for project assets
- streams the client script bundle to players running the client mod

Networking uses `network-engine` packet definitions and transports them over plugin messaging (`moud:wrapper`).

## Client Runtime (`client-mod/`)

The client mod runs inside Minecraft (Fabric) and mirrors the scripting model:

- it applies the server-provided resource pack, then loads the client script bundle
- it runs client scripts in GraalVM and exposes the `Moud` global
- it owns local-only systems like UI overlays, input, audio and voice, and rendering (Veil)

Client and server talk through custom packets and events. The server stays authoritative for gameplay state. The client focuses on presentation and player-side tools.

## Modules 

- `network-engine` - packet definitions and serializers shared by server and client
- `plugin-api` - stable Java plugin interfaces implemented by the server
- `packages/sdk` - TypeScript API surface for scripts
- `packages/moud-cli` - dev workflow, bundling, and launching

