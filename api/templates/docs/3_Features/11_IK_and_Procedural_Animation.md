# IK & Procedural Animation



Moud's IK solver is a **server-side solver** that broadcasts joint transforms to clients. Your script owns the chains, the targets, and when/how often they get updated.

---

## The model (what an IK chain is in Moud)

An IK chain has:

- an `id` (unique)
- a **root** (where the chain starts)
- a list of segments (lengths)
- a **target** (where the end effector tries to go)

And it has two ways to update:

1. **Manual**: you call `solveAndBroadcast()` yourself when you change targets.
2. **Auto-solve**: you enable `setAutoSolve(true)`, then only set targets and let the runtime solve/broadcast over time.

If you only call `setTarget()` without solving (manual) or enabling auto-solve, clients won’t see the updates.

---

## Create a chain 

### Two-bone (arm/leg)

Use this for humanoid limbs.

```ts
const arm = api.ik.createTwoBoneChain(
  'demo:arm_left',
  0.45,                    // upper length
  0.40,                    // lower length
  api.math.vector3(0, 64, 0), // initial root position
  api.math.vector3(0, 0, 1)   // pole (bend direction)
);
```

### Spider/insect leg (3 segments)

This is the one you want for procedural legs:

```ts
const leg = api.ik.createSpiderLegChainWithPole(
  'demo:leg_0',
  0.3, 0.5, 0.6,
  api.math.vector3(0, 64, 0),
  api.math.vector3(1, 0, 0) // outward direction (determines bend)
);
```

### Multi-segment

```ts
const tail = api.ik.createUniformChain('demo:tail', 6, 0.18, api.math.vector3(0, 64, 0));
```

---

## Example: “arm reaches the cursor”

In this example, we will attaches the chain root to the player (so it follows them), targets the cursor hit position, solves + broadcasts on click

```ts
const arm = api.ik.createTwoBoneChain(
  'demo:arm',
  0.45,
  0.40,
  api.math.vector3(0, 64, 0),
  api.math.vector3(0, 0, 1)
);

api.on('player.click', (player, data) => {
  if (data.button !== 0) return;

  arm.attachToEntity(player.getUuid(), api.math.vector3(0, 1.2, 0));

  const cursor = player.getCursor();
  const target = cursor.getPosition();

  arm.setTarget(target);
  arm.solveAndBroadcast();
});
```

---

## Auto-solve + broadcast rate (for “continuous” animation)

For things like foot placement, you usually want:

- `chain.setAutoSolve(true)`
- a lower-frequency broadcast rate (to reduce traffic)
- a small `setInterval` loop that updates targets

### Broadcast rate

The server broadcasts chain updates every tick by default. If you have many chains, reduce the rate:

```ts
// every 2 ticks instead of every tick (1 = default)
api.ik.setDefaultBroadcastRate(2);
```

### Smoothness / responsiveness

`setInterpolationFactor(f)` controls how quickly a chain “steps” toward new targets:

- `1.0` = fastest response
- lower values = smoother but slower

```ts
arm.setAutoSolve(true);
arm.setInterpolationFactor(0.35);
```

---

## Foot placement: raycast down + set targets

`raycastGround` is a convenience raycast downwards against server chunk meshes:

```ts
const hit = api.ik.raycastGround({
  position: api.math.vector3(0, 80, 0),
  maxDistance: 128
});

if (hit) {
  console.log(hit.position, hit.normal, hit.distance);
}
```

In practice, you raycast from “above the foot” and set the chain target to `hit.position`.

---

## Cleanup 

Chains are server-owned objects. Clean them up when the thing they’re attached to disappears:

```ts
api.on('player.leave', (event) => {
  api.ik.removeAllChainsForEntity(event.getUuid());
});
```

If you created chains with stable ids, you can also safely recreate them: creating a chain with an existing id replaces the old one.

---

## Tips

- Prefer `createSpiderLegChainWithPole` for procedural legs; the “outward direction” solves 90% of bending weirdness.
- If your chain looks “inside out”, your pole/outward vector is usually the culprit.
- Use `setAutoSolve(true)` + `setDefaultBroadcastRate(2..4)` when you have lots of chains.
- Debug visually: `api.primitives.createBone(...)` and `createJoint(...)` make it easy to see joint positions while you tune targets.
