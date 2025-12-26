# Primitives & Debug Draw

Primitives are the fastest way to see something when you’re building gameplay.

Instead of spawning full models, you can draw simple shapes:

- cubes / spheres / cylinders / capsules (volumes)
- lines / line strips (rays, paths, gizmos)
- bones / joints (great for visualizing IK)

They’re server-side (`api.primitives`) and synced to clients.

Primitives can also create **server-side physics colliders** via `options.physics`, but note:

- Shared physics prediction controllers use their own `CollisionWorld` and do not automatically collide with Jolt rigid bodies.

---

## The model

Primitives are **cheap** and meant for iteration/debug. You get back a handle (`Primitive`) that you can move/update/remove. If you create lots of them, use `groupId` so you can delete them in one call.

---

## Quick examples

### Draw a ray (camera direction)

```ts
api.on('player.click', (player, data) => {
  if (data.button !== 0) return;

  const origin = player.getPosition();
  const dir = player.getCameraDirection();
  const end = origin.add(dir.multiply(8));

  api.primitives.createLine(origin, end, { r: 1, g: 0, b: 0 });
});
```

### Debug cube (semi-transparent, x-ray)

```ts
api.primitives.create('cube', {
  groupId: 'debug',
  position: api.math.vector3(0, 64, 0),
  scale: api.math.vector3(1, 1, 1),
  material: { r: 1, g: 1, b: 0, a: 0.35, unlit: true, renderThroughBlocks: true }
});
```

Cleanup later:

```ts
api.primitives.removeGroup('debug');
```

---

## Materials 

Material fields are simple:

- `r/g/b/a` in 0..1
- `unlit`: no shading (good for debug overlays)
- `renderThroughBlocks`: “x-ray”
- `doubleSided`: render both sides of faces (recommended for `plane`)

Note: `plane` is a single quad, so with culling enabled it will be visible only from one side. Use `doubleSided: true` when you want a two-sided floor/marker.
- `texture`: a texture id (same idea as displays: `moud:textures/...png`)

---

## Updating primitives 
Every create call returns a handle you can update:

```ts
const marker = api.primitives.createSphere(
  api.math.vector3(0, 66, 0),
  0.25,
  { r: 0.2, g: 0.8, b: 1, a: 0.9, unlit: true }
);

// move it later
marker.setPosition(api.math.vector3(2, 66, 0));

// remove when done
marker.remove();
```

### Line strips

```ts
const path = api.primitives.createLineStrip(
  [api.math.vector3(0, 64, 0), api.math.vector3(2, 65, 0), api.math.vector3(4, 64, 1)],
  { r: 0, g: 1, b: 0 }
);

// update vertices later
path.setVertices([api.math.vector3(0, 64, 0), api.math.vector3(2, 66, 0), api.math.vector3(4, 64, 2)]);
```

---

## Debugging IK with bones/joints

You can visualize an IK chain by drawing a “bone” between each pair of joints:

```ts
const chain = api.ik.createTwoBoneChain(
  'debug:arm',
  0.45,
  0.40,
  api.math.vector3(0, 64, 0),
  api.math.vector3(0, 0, 1)
);
chain.setAutoSolve(true);

const groupId = 'debug:ik';
const bone0 = api.primitives.create('cube', { groupId, material: { r: 0.3, g: 1, b: 0.3, unlit: true } });
const bone1 = api.primitives.create('cube', { groupId, material: { r: 0.3, g: 1, b: 0.3, unlit: true } });
const joint0 = api.primitives.create('sphere', { groupId, material: { r: 1, g: 1, b: 1, unlit: true } });
const joint1 = api.primitives.create('sphere', { groupId, material: { r: 1, g: 1, b: 1, unlit: true } });
const joint2 = api.primitives.create('sphere', { groupId, material: { r: 1, g: 1, b: 1, unlit: true } });

setInterval(() => {
  const state = chain.getState();
  const p0 = state.jointPositions[0];
  const p1 = state.jointPositions[1];
  const p2 = state.jointPositions[2];

  bone0.setFromTo(p0, p1, 0.06);
  bone1.setFromTo(p1, p2, 0.05);

  joint0.setPosition(p0);
  joint0.setScale(api.math.vector3(0.12, 0.12, 0.12));
  joint1.setPosition(p1);
  joint1.setScale(api.math.vector3(0.12, 0.12, 0.12));
  joint2.setPosition(p2);
  joint2.setScale(api.math.vector3(0.12, 0.12, 0.12));
}, 50);
```

When you’re done:

```ts
api.primitives.removeGroup('debug:ik');
chain.remove();
```

---

## Batch mode (for lots of primitives)

If you’re spawning/updating dozens of primitives at once (editors, gizmos), batch the work:

```ts
api.primitives.beginBatch();
for (let i = 0; i < 50; i++) {
  api.primitives.createSphere(api.math.vector3(i * 0.5, 64, 0), 0.15, { r: 0, g: 0.6, b: 1 });
}
api.primitives.endBatch();
```

---


> Use `groupId` aggressively. Debug visuals are >disposable, and `removeGroup()` is the cleanest >cleanup path.
> - Prefer `unlit: true` for debug: it reads well  in dark places.
> - If you don’t see a primitive, try `renderThroughBlocks: true` while debugging.
