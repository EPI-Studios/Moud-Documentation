# Sync and Timing

Moud runs on two clocks:

- Server tick (authoritative, 20 TPS)
- Client frame (render loop, variable)

Server systems update on ticks. Client visuals update on frames. Networking carries state between them, and the client interpolates between updates.

## Server tick (authoritative)

The server keeps a list of systems (`MoudSystem`) and ticks them once per server tick.

- `server/src/main/java/com/moud/server/MoudEngine.java` (`registerSystem`, `registerDefaultSystems`, `startSystemsTick`)

This pattern is used for work that should run in a stable order every tick (animations, batching, flushes).

## Batching example (particles)

Particle spawns are queued and flushed once per tick.

- `server/src/main/java/com/moud/server/particle/ParticleBatcher.java`
- Registered from `MoudEngine.registerDefaultSystems()`

The goal is that a script can call `api.particles.spawn()` many times in a loop and the server still sends one packet for that tick.

## Client frame (render loop)

The client mod renders and updates per-frame systems from Fabric render events.

- Hook: `client-mod/src/main/java/com/moud/client/init/ClientRenderController.java` (`WorldRenderEvents.AFTER_ENTITIES`)
- `tickDelta`: partial-tick value used for interpolation
- `frameSeconds`: wall-clock delta computed from `System.nanoTime()` (used for particle simulation)

Particles tick using `frameSeconds`, so motion stays smooth even when tick timing is uneven.

## Interpolation (visual smoothing)

Network-driven objects store a previous and target state, then interpolate on render.

Examples:

- Models: `client-mod/src/main/java/com/moud/client/model/RenderableModel.java`
- Displays: `client-mod/src/main/java/com/moud/client/display/DisplaySurface.java`
- Cursors: `client-mod/src/main/java/com/moud/client/cursor/RemoteCursor.java`
- Primitives: `client-mod/src/main/java/com/moud/client/primitives/ClientPrimitive.java`

## Where to put code

- Game state and authority: server tick (manager/system)
- Network sending: batch and flush once per tick when possible
- Visual-only behavior: client render loop, driven by `tickDelta` or `frameSeconds`
