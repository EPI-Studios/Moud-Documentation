# Player Prediction & Shared Physics

Moud supports **client-side prediction** using **shared physics controllers**.

Shared physics is the “one source of truth” for movement: the same `step(...)` code runs on both client and server, so movement stays responsive without client/server desync from mismatched collision/logic.

When prediction is enabled:

- the client simulates movement locally for instant response
- the server runs the same controller for validation / anti-cheat
- the server periodically sends authoritative snapshots and the client reconciles

This keeps movement responsive without sacrificing server authority.

---

## Folder layout

Shared controllers live in your project at:

- `shared/physics/index.ts`

That script is transpiled and shipped to Moud clients as part of the client script bundle.

---

## Enabling prediction

Enable prediction only for clients that completed the Moud handshake:

```ts
api.on('moud.player.ready', (player) => {
  api.physics.setPredictionMode(player, true, {
    controller: 'my-game:custom',
    config: {
      // optional overrides
      speed: 4.3,
      jumpForce: 9.0
    }
  });
});
```

Disable it later:

```ts
api.physics.setPredictionMode(player, false);
```

---

## Writing a shared controller

A shared controller exports a `controller` with an `id` and a `step(...)` function.

```ts
import type {
  SharedPhysicsController,
  PlayerPhysicsState,
  PlayerPhysicsInput,
  PlayerPhysicsConfig,
  CollisionWorld,
  PlayerPhysicsContext
} from '@epi-studio/moud-sdk';

export const controller: SharedPhysicsController = {
  id: 'my-game:custom',

  step(state: PlayerPhysicsState, input: PlayerPhysicsInput, config: PlayerPhysicsConfig, collision: CollisionWorld, ctx: PlayerPhysicsContext) {
    const modified: PlayerPhysicsConfig = { ...config };

    // example: low gravity zone
    if (ctx.world.isInZone(state.x, state.y, state.z, 'low_gravity')) {
      // gravity is negative = down; closer to 0 means floatier
      modified.gravity = Math.max(modified.gravity, -12.0);
    }

    return Physics.defaultStep(state, input, modified, collision, ctx.dt);
  }
};
```

---

## Return value requirements

Your `step(...)` must return a complete `PlayerPhysicsState` (position, velocity, flags). To avoid missing fields (and client parse errors), prefer:

- `Physics.defaultStep(...)` for the core integration
- `Physics.createState(...)` when you need to override one or two fields

---

## What not to do in `step(...)`

Shared physics runs in a restricted, deterministic context on both sides. Avoid:

- side effects like `player.sendMessage(...)` / spawning entities / writing files
- non-deterministic data (`Math.random()`, `Date.now()`, timers)
- reading client-only state (UI, camera, rendering state)

If the server logs warnings like “controller threw exception … Message not supported”, it usually means the controller attempted a disallowed operation and the server fell back to the default controller (causing mismatch).

## What the controller can query

`ctx` is designed to stay deterministic between client and server:

- `ctx.player`:
  - `uuid`
  - `hasItem(itemId)`
  - `getHealth()`
  - `hasEffect(effectId)`
  - `getData(key)`
- `ctx.world`:
  - `getBlock(x, y, z)`
  - `isInZone(x, y, z, zoneId)`

---

## Zones and prediction

If you use `ctx.world.isInZone(...)`, define the zone on the server:

```ts
api.zones.create('low_gravity', { x: -2, y: 70, z: 10 }, { x: 2, y: 90, z: 14 });
```

Zones are replicated to Moud clients so zone-based shared physics stays consistent.

Notes:

- **scene zones** (created in the editor) are persisted
- **runtime zones** (created by script) are not persisted
- Runtime zones are not scene objects, so they may not appear in the editor hierarchy; visualize them with primitives if needed.

---


## Debugging

### 1) Confirm the shared controller is loaded

- Server log should contain a line like: `Registered shared physics controller: my-game:custom`.

### 2) Confirm zones are being received by the client

Open the in-editor **Diagnostics** panel; you should see messages like:

- `Runtime zones synced: N`
- `Runtime zone upsert: low_gravity`

### 3) Common issues

- Enabling prediction before `moud.player.ready` (client doesn’t have the controller yet)
- Using non-deterministic data in the controller (randomness, wall clock time)
- Zone IDs not matching exactly (case-sensitive)
- `Failed to parse client physics result: ... getMember(...) is null`: your controller returned an object missing required fields; use `Physics.defaultStep(...)` / `Physics.createState(...)`.
- `Arity error - expected: 4 actual: 3` when calling `api.zones.create(...)`: you’re on an older build; update to a version that supports the 3-argument overload or pass an explicit `options` object.
- `No serializer for type: ... ZoneDefinition`: client/server protocol mismatch; update both sides to the same version.
