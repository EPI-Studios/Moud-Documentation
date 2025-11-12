# Lighting System

Moud ships with a client-rendered lighting pipeline powered by [Veil](https://github.com/foundry-mc/veil). Lights are defined entirely from TypeScript on the server, replicated over the custom packet engine, and rendered per-player on the Fabric mod. You can spawn, move, and delete lights every tick without touching Minecraft’s limited vanilla lightmap.

## Architecture

1. Server scripts call `api.lighting.*` (backed by `LightingAPIProxy`).
2. `ServerLightingManager` stores light definitions and broadcasts operations (`create`, `update`, `remove`) to connected clients via `ServerNetworkManager`.
3. Clients feed those operations into Veil, which renders additive light volumes with per-pixel falloff and post-processing.
4. When a player reconnects, `ServerLightingManager.syncLightsToPlayer` pushes the full catalogue so they instantly see the existing setup.

`AxiomBridgeService` also mirrors light transforms to the Axiom external editor so you can drag gizmos in real time while the game runs.

## Light Types

| Type | API | Description |
| --- | --- | --- |
| Point | `createPointLight(id, position, color, radius, brightness)` | Emits uniformly in all directions from a 3D point.  |
| Area | `createAreaLight(id, position, direction, color, width, height, brightness)` | Emits from a rectangular plane with a facing direction. Perfect for monitors, windows, neon signs. |
| Directional | _planned_ |        ~ |

`id` can be any positive long, but you are responsible for keeping it unique. A common pattern is to hash coordinates or entity UUIDs.

### Example

```ts
const lighting = api.lighting;

// torch
lighting.createPointLight(
  10,
  api.math.vector3(4, 66, 2),
  api.math.vector3(1.0, 0.75, 0.3),
  7.5,
  1.3
);

// holographic wall
lighting.createAreaLight(
  42,
  api.math.vector3(-6, 70, -10),
  api.math.vector3(0, -1, 0),
  api.math.vector3(0.2, 0.7, 1.0),
  6,
  3,
  0.9
);
```

### Updating & Removing

```ts
lighting.updateLight(42, {
  x: -4,
  y: 72,
  brightness: 1.5,
  width: 8
});

lighting.removeLight(10);
```

`updateLight` accepts a plain object; any fields you include overwrite the previous ones. Common keys:

- `x/y/z`
- `dirX/dirY/dirZ` (for area lights)
- `r/g/b`
- `radius`, `brightness`, `width`, `height`
- `loop`, `pulse`, or any custom property you consume client-side
