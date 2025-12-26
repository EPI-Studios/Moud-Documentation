# Primitives

Primitives are server-side “basic shapes” you can spawn for:

- debug visuals
- gizmos
- lightweight scene dressing

They’re replicated to modded clients automatically. The returned `Primitive` handle lets you update transform/material and remove it later.

## Primitive types

Supported `PrimitiveType` values:

- `cube`, `sphere`, `cylinder`, `capsule`, `cone`, `plane`
- `line`, `lineStrip`
- `mesh` (custom indexed triangle mesh)

## Materials (`PrimitiveMaterial`)

Material fields map directly to the client renderer:

- `r`, `g`, `b`, `a` (0–1)
- `texture?: string` (ex: `moud:textures/crate.png`)
- `unlit?: boolean` (flat shaded)
- `doubleSided?: boolean`
- `renderThroughBlocks?: boolean` (x-ray style)

Helper creators are available in the SDK:

```ts
const solid = primitiveMaterial(1, 0, 0, 0.8);
const unlit = primitiveUnlit(0.2, 0.8, 1.0, 1.0);
const xray = primitiveXRay(1, 1, 0, 0.35);
```

## Quick examples

### A debug cube

```ts
const cube = api.primitives.createCube(
    api.math.vector3(0, 64, 0),
    api.math.vector3(1, 1, 1),
    { r: 1, g: 0, b: 0, a: 0.8 }
);
```

### A line

```ts
api.primitives.createLine(
    api.math.vector3(0, 64, 0),
    api.math.vector3(5, 64, 0),
    { r: 0, g: 1, b: 0 }
);
```

### Group + cleanup

If you create lots of primitives (ex: per-object gizmos), give them a group id and remove them as a batch.

```ts
const handle = api.primitives.create('cube', {
    position: api.math.vector3(0, 64, 0),
    scale: api.math.vector3(1, 1, 1),
    groupId: 'debug',
    material: { r: 1, g: 1, b: 0 }
});

api.primitives.removeGroup('debug');
```

## Full creation API (`api.primitives.create`)

`create(type, options)` gives you full control:

```ts
api.primitives.create('capsule', {
    position: api.math.vector3(0, 66, 0),
    rotation: api.math.quaternionFromEuler(0, 45, 0),
    scale: api.math.vector3(0.6, 1.8, 0.6),
    material: { r: 0.8, g: 0.9, b: 1.0, a: 1.0, unlit: true },
    groupId: 'debug',
});
```

### Physics (optional)

Primitives can optionally carry a server-side rigid body:

```ts
api.primitives.create('cube', {
    position: api.math.vector3(0, 80, 0),
    scale: api.math.vector3(1, 1, 1),
    material: { r: 1, g: 0.3, b: 0.8 },
    physics: { dynamic: true, mass: 2.0 },
});
```

### Mesh primitives

For custom geometry, use type `mesh` with `vertices` (and optional `indices`):

```ts
const vertices = [
    api.math.vector3(-1, 0, -1),
    api.math.vector3( 1, 0, -1),
    api.math.vector3( 1, 0,  1),
    api.math.vector3(-1, 0,  1),
];

// two triangles
const indices = [0, 1, 2, 0, 2, 3];

api.primitives.create('mesh', {
    position: api.math.vector3(0, 64, 0),
    material: { r: 0.2, g: 0.6, b: 1.0, a: 0.9, doubleSided: true },
    vertices,
    indices,
});
```

## Batch mode

Batch mode lets the server send fewer network messages when you’re spawning/updating many primitives at once:

```ts
api.primitives.beginBatch();
for (let i = 0; i < 50; i++) {
    api.primitives.createSphere(api.math.vector3(i, 64, 0), 0.2, { r: 0, g: 0.5, b: 1 });
}
api.primitives.endBatch();
```

## Finding existing primitives

```ts
const all = api.primitives.getAllPrimitives();
const byGroup = api.primitives.getPrimitivesInGroup('debug');
```

## Updating and removing

```ts
cube.setPosition(api.math.vector3(0, 66, 0));
cube.setColorAlpha(1, 0, 0, 0.5);
cube.setRenderThroughBlocks(true);
cube.remove();
```
