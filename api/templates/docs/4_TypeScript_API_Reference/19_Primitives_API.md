# Primitives

Primitives are server-side “basic shapes” you can spawn for:

- debug visuals
- gizmos
- lightweight scene dressing

## Quick examples

### A debug cube

```ts
const cube = api.primitives.createCube(
    api.math.vector3(0, 64, 0),
    api.math.vector3(1, 1, 1),
    { color: api.math.vector3(1, 0, 0), alpha: 0.8 }
);
```

### A line

```ts
api.primitives.createLine(
    api.math.vector3(0, 64, 0),
    api.math.vector3(5, 64, 0),
    { color: api.math.vector3(0, 1, 0) }
);
```

### Group + cleanup

If you create lots of primitives (ex: per-object gizmos), give them a group id and remove them as a batch.

```ts
const handle = api.primitives.create('cube', {
    position: api.math.vector3(0, 64, 0),
    scale: api.math.vector3(1, 1, 1),
    groupId: 'debug',
    material: { color: api.math.vector3(1, 1, 0) }
});

api.primitives.removeGroup('debug');
```

## Batch mode

Batch mode lets the server send fewer network messages when you’re spawning/updating many primitives at once:

```ts
api.primitives.beginBatch();
for (let i = 0; i < 50; i++) {
    api.primitives.createSphere(api.math.vector3(i, 64, 0), 0.2, { color: api.math.vector3(0, 0.5, 1) });
}
api.primitives.endBatch();
```

## Finding existing primitives

```ts
const all = api.primitives.getAllPrimitives();
const byGroup = api.primitives.getPrimitivesInGroup('debug');
```

For the full set of creation options and material fields, see `packages/sdk/src/index.ts`.
