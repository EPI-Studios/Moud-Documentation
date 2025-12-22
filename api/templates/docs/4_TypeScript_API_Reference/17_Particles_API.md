# Particles 

`api.particles` is server-side. You describe what a particle should look like (a `ParticleDescriptor`), and the server tells clients what to render.

You usually do one of two things:

- **Burst**: spawn a one-shot set of particles (`spawn` / `spawnMany`)
- **Emitter**: create/update a persistent emitter with an id (`createEmitter` / `updateEmitter`)

## One-shot spawn

```ts
api.particles.spawn({
    texture: 'minecraft:particle/flame',
    renderType: 'additive',
    lifetime: { min: 0.3, max: 0.6 },
    position: api.math.vector3(0, 65, 0),
    velocity: api.math.vector3(0, 0.2, 0),
    size: { min: 0.1, max: 0.2 },
    color: { r: 1, g: 0.6, b: 0.2, a: 1 }
});
```

Batch version:

```ts
api.particles.spawnMany([
    { texture: 'minecraft:particle/smoke', position: api.math.vector3(0, 65, 0) },
    { texture: 'minecraft:particle/smoke', position: api.math.vector3(0.2, 65, 0) }
]);
```

## Emitters (persistent)

Emitters are identified by `id`. Creating the same id again behaves like an upsert.

```ts
api.particles.createEmitter({
    id: 'lobby_flame',
    descriptor: {
        texture: 'minecraft:particle/flame',
        renderType: 'additive',
        lifetime: { min: 0.5, max: 0.9 },
        size: { min: 0.08, max: 0.15 }
    },
    rate: 16,
    enabled: true,
    maxParticles: 512,
    positionJitter: api.math.vector3(0.2, 0.1, 0.2)
});
```

Update the emitter later:

```ts
api.particles.updateEmitter({
    id: 'lobby_flame',
    enabled: false
});
```

Remove it:

```ts
api.particles.removeEmitter('lobby_flame');
```

## Descriptor 

- If you spawn in a tight loop, prefer emitters or batch (`spawn([...])`) to reduce overhead.
- Start simple: get a texture rendering first, then add billboarding, ramps, collisions, light, etc.

For the full `ParticleDescriptor` / `ParticleEmitterConfig` schema, check `packages/sdk/src/index.ts`.
