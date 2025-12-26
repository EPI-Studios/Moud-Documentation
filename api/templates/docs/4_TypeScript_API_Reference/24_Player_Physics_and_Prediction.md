# Player Physics & Prediction

This page documents `api.physics` features related to **player movement**, **prediction**, and **shared physics controllers**.

## setPlayerPhysics

Enable or disable server-side physics-driven movement for a player:

```ts
api.physics.setPlayerPhysics(player, true);
api.physics.setPlayerPhysics(player, false);
```

## setPredictionMode

Enable client-side prediction using a controller from `shared/physics/index.ts`:

```ts
api.on('moud.player.ready', (player) => {
  api.physics.setPredictionMode(player, true, {
    controller: 'my-game:custom',
    config: { speed: 4.3, jumpForce: 9.0 }
  });
});
```

- `controller` is optional; if omitted, Moud uses the default controller.
- `config` is optional and overrides the base `PlayerPhysicsConfig`.

## setPlayerGravityFactor

Sets a gravity multiplier for a **server physics body**:

```ts
api.physics.setPlayerPhysics(player, true);
api.physics.setPlayerGravityFactor(player, 0.2); // 20% gravity
```

Notes:

- This affects Jolt physics bodies (server-side), not the `PlayerPhysicsConfig.gravity` used by shared prediction controllers.
- For prediction/shared physics “low gravity”, modify `config.gravity` in `shared/physics/index.ts` (often gated by zones).

## Shared physics controllers

Shared controllers run **identically** on both client and server.

- Location: `shared/physics/index.ts`
- Export: `export const controller: SharedPhysicsController = { ... }`
- Signature: `step(state, input, config, collision, ctx) => PlayerPhysicsState`

Use the `Physics` global:

- `Physics.defaultStep(state, input, config, collision, dt)`
- `Physics.createState(...)`

## Determinism notes

- Prefer `ctx.world.getBlock(...)` and `ctx.world.isInZone(...)` for environment queries.
- Avoid `Math.random()` or time-based logic.
- If you use zones, define them on the server via `api.zones.create(...)`.

## Primitives and collision

Primitives can optionally create server-side physics colliders via `options.physics`, but:

- “Vanilla” players won’t collide with them unless server player physics is enabled (`api.physics.setPlayerPhysics(player, true)`).
- Shared physics prediction controllers use the `CollisionWorld` passed to `step(...)` and do not automatically collide with Jolt rigid bodies.
