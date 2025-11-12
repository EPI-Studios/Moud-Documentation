# Moud Architecture

Moud is a TypeScript-first workflow built on four pillars:

```
┌────────────┐    ┌──────────────────┐    ┌───────────────┐
│  CLI + SDK │    │  Minestom Server │    │ Fabric Client │
│ (Node.js)  │ -> │  + GraalVM JS    │ -> │  + GraalVM JS │
└────────────┘    └──────────────────┘    └───────────────┘
         │                ▲    │                   ▲
         └───── assets ───┴────┴── network engine ─┘
```

TypeScript is authored once and executed in both the standalone server and the Fabric client. Everything else bundling, asset streaming, state sync, hot reload is infrastructure that keeps those two runtimes in lockstep.

## 1. Tooling Layer (packages/moud-cli + packages/sdk)

- `packages/moud-cli` exposes `moud create/dev/pack`.  
  - It installs Java 21 and the latest `moud-server.jar` automatically.  
  - Then the transpiler (esbuild + AdmZip) bundles server and client scripts, caches them under `.moud/cache`, and generates a manifest/hash.  

- `packages/sdk` is type-only. It injects global declarations (`api`, `Moud`, `Vector3`, `Player`, `SharedStore`, etc.) so IDEs understand every proxy exposed by the runtime.

## 2. Server Runtime (server/)

The Server is **not** a Spigot/Bukkit plugin. It is its own Minestom distribution (`com.moud.App`) with the following services:


**Moud** acts as the orchestrator of the engine. It loads the project, initializes all managers and services, binds the scripting API, and controls hot-reloads. Once initialized, it runs your transpiled TypeScript through GraalVM, exposing a sandboxed scripting environment with familiar global helpers (`setTimeout`, `setInterval`, `requestAnimationFrame`) and a unified `api` object for interacting with the server.

At runtime, the system builds a bridge between scripts and the Minestom server through a series of **proxy layers**, ensuring safe and structured access to game entities, world data, and gameplay systems. Asset management, client bundling, and networking are handled then assets and client scripts are scanned, bundled, and streamed to players  during connection.


For development and diagnostics, Moud exposes optional services such as a live hot-reload endpoint, a profiling UI, and bridges for external creative tools. Together, these components create a cohesive runtime that allows live scripting, dynamic asset streaming, and low-latency server–client interaction, all without restarting the server.




## 3. Client Runtime (client-mod/)



On the client side, players run the **fabric mod**, which mirrors the server’s scripting and service architecture. It embeds its own GraalVM runtime to execute TypeScript directly in Minecraft, providing the same `Moud` global environment and APIs available on the server. This allows scripts to share logic seamlessly across both ends, from gameplay systems to UI interactions etc...

The client runtime manages all local systems for the player experience: rendering and post-processing (via Veil), lighting, audio playback and microphone streaming, cursors and cameras, input and gamepads, as well as a full UI overlay framework inspired by web layout models. These services are unified under the `Moud.*` namespace, exposing a coherent API surface.

Networking is handled through a lightweight wrapper over plugin channels, translating data between client and server systems with minimal boilerplate. Shared state is continuously synchronized in both directions, allowing responsive updates and real-time collaboration between players and server logic.

Overall, the client mod acts as the **mirror half of Moud**, turning the Minecraft client into a programmable environment where gameplay logic, UI, and visuals are fully scriptable and hot-reloadable .


---

The following pages dive into events, shared state, and the individual features exposed by these services.
