# Feature Pipeline

A feature that affects gameplay and visuals usually touches five places:

1. Shared network contract (`network-engine`)
2. Server authority and state (`server`)
3. Client representation (`client-mod`)
4. Public surface (`plugin-api` and/or `packages/sdk`)
5. Editor integration (optional)

This page uses world displays as a real example.

## 1. Shared contract (`network-engine`)

Display packets and enums live in `network-engine/src/main/java/com/moud/network/MoudPackets.java`:

- `S2C_CreateDisplayPacket`
- `S2C_UpdateDisplayTransformPacket`
- `S2C_UpdateDisplayAnchorPacket`
- `S2C_UpdateDisplayContentPacket`
- `S2C_UpdateDisplayPlaybackPacket`
- `S2C_RemoveDisplayPacket`
- `DisplayAnchorType`, `DisplayContentType`, `DisplayBillboardMode`

This is the on-wire layout. If you change it, both server and client must update together.

## 2. Server authority (`server`)

Server-side state is owned by managers and proxies:

- `server/src/main/java/com/moud/server/entity/DisplayManager.java` keeps the active displays and ticks anchored ones.
- `server/src/main/java/com/moud/server/proxy/MediaDisplayProxy.java` is the script-facing controller. It validates input, updates state, and emits packets.

When a display changes (transform, anchor, content, playback), the server sends the corresponding packet to connected Moud clients.

## 3. Public surfaces (TypeScript and Java)

TypeScript scripts create displays through `api.world.createDisplay(...)`.

- Proxy entry point: `server/src/main/java/com/moud/server/proxy/WorldProxy.java` (`createDisplay`)
- SDK types: `packages/sdk/src/index.ts` (`DisplayOptions`, `Display`)

Java plugins do the same through `PluginContext.world().createDisplay(...)`.

- API types: `plugin-api/src/main/java/com/moud/plugin/api/world/DisplayOptions.java` and `plugin-api/src/main/java/com/moud/plugin/api/world/DisplayHandle.java`
- Service API: `plugin-api/src/main/java/com/moud/plugin/api/services/WorldService.java`
- Server implementation: `server/src/main/java/com/moud/server/plugin/impl/WorldServiceImpl.java`

## 4. Client representation (`client-mod`)

On the client:

- Network handlers: `client-mod/src/main/java/com/moud/client/init/ClientNetworkRegistry.java` forwards display packets to `ClientDisplayManager`.
- State: `client-mod/src/main/java/com/moud/client/display/ClientDisplayManager.java` owns `DisplaySurface` instances.
- Rendering: `client-mod/src/main/java/com/moud/client/display/DisplayRenderer.java` draws them each frame from `ClientRenderController`.

`DisplaySurface` uses interpolation to smooth transforms between network updates.

## 5. Editor integration (optional)

Scene objects are generic maps. A runtime adapter translates scene properties into display calls.

- Adapter: `server/src/main/java/com/moud/server/editor/runtime/DisplayRuntimeAdapter.java`
- Registration: `server/src/main/java/com/moud/server/editor/runtime/SceneRuntimeFactory.java`

If your feature should be editable, add:

- a server runtime adapter (create/update/remove)
- client editor UI for its properties
- selection support via the runtime object registry
