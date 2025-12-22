# Particle API 

Moud lets you script particles emitters 

## Spawning

### spawn
```ts
spawn(descriptor: ParticleDescriptor, emitter: ParticleEmitterConfig): string
```
Creates an emitter on the server and starts sending its particles to clients. Returns an emitter id you can reuse.

- Parameters:
  - `descriptor`: Visual/behavior definition.
  - `emitter`: Placement and emission settings.
- Returns: `string` id.
- You need to reuse descriptors/emitter ids; don’t spawn a new one every tick.
- Example:
```ts

const flame: ParticleDescriptor = {
  texture: 'minecraft:particle/flame',
  renderType: 'ADDITIVE',
  billboarding: { mode: 'CAMERA_FACING' },
  lifetime: { min: 8, max: 12 },
  size: { start: 0.2, end: 0.05 },
  color: { r: 1, g: 0.6, b: 0.2, a: 1 },
  velocity: { x: 0, y: 0.08, z: 0 },
  drag: 0.9
};

const emitter: ParticleEmitterConfig = {
  position: { x: 0.5, y: 65, z: 0.5 },
  rate: 48,
  maxParticles: 256,
  enabled: true
};

const flameId = api.particles.spawn(flame, emitter);
```

## Updating and Stopping

### updateEmitter
```ts
updateEmitter(id: string, patch: Partial<ParticleEmitterConfig>): void
```
Changes an existing emitter without recreating it. Use it to move, pause, or adjust rate/budget.

- Example:
```ts
api.particles.updateEmitter(flameId, { position: player.getPos(), rate: 24 });
```

### stop
```ts
stop(id: string): void
```
Stops and removes an emitter.

```ts
api.particles.stop(flameId);
```
