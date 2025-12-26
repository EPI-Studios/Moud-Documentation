# Zones

Zones are server-side trigger volumes: when a player enters/leaves an axis-aligned box, your callbacks fire.

## API

### create

```ts
api.zones.create(id, corner1, corner2, options?);
```

- `corner1` / `corner2` can be either:
  - `api.math.vector3(x, y, z)`
  - a plain object literal `{ x, y, z }`
- `options` is optional.

```ts
api.zones.create(
    'lobby',
    { x: 0, y: 64, z: 0 },
    { x: 12, y: 72, z: 12 },
    {
        onEnter: (player, zoneId) => player.sendMessage(`entered ${zoneId}`),
        onLeave: (player, zoneId) => player.sendMessage(`left ${zoneId}`)
    }
);
```

### setCallbacks

```ts
api.zones.setCallbacks('lobby', {
    onEnter: (player) => player.sendMessage('welcome back'),
    onLeave: undefined
});
```

### remove

```ts
api.zones.remove('lobby');
```

## Notes

- Zones are axis-aligned (no rotation).
- Overlapping zones all fire; it’s up to you to decide how to combine effects.
- Runtime zones created via `api.zones.create(...)` are not persisted as scene objects.
- If you use zones from shared physics (`shared/physics/`), zones are replicated to Moud clients so `ctx.world.isInZone(...)` stays deterministic.

## Visualizing runtime zones

Runtime zones are not scene objects, so they may not appear in the editor hierarchy. A simple workaround is to draw a debug outline with primitives:

```ts
const min = { x: 0, y: 64, z: 0 };
const max = { x: 12, y: 72, z: 12 };
api.zones.create('lobby', min, max);

// Draw the top rectangle (quick visual marker)
api.primitives.createLine({ x: min.x, y: max.y, z: min.z }, { x: max.x, y: max.y, z: min.z }, { r: 0, g: 1, b: 1 });
api.primitives.createLine({ x: max.x, y: max.y, z: min.z }, { x: max.x, y: max.y, z: max.z }, { r: 0, g: 1, b: 1 });
api.primitives.createLine({ x: max.x, y: max.y, z: max.z }, { x: min.x, y: max.y, z: max.z }, { r: 0, g: 1, b: 1 });
api.primitives.createLine({ x: min.x, y: max.y, z: max.z }, { x: min.x, y: max.y, z: min.z }, { r: 0, g: 1, b: 1 });
```
