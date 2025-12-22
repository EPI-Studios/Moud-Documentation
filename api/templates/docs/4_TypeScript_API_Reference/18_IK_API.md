# IK

`api.ik` is a server-side inverse kinematics system. You create a chain, move its target, and let the solver compute joint positions/rotations. The server then broadcasts the chain state to clients so you can drive animated rigs.

## Create a chain

### Two-bone (arm/leg)

```ts
const chain = api.ik.createTwoBoneChain(
    'arm_left',
    0.45, // upper length
    0.40, // lower length
    api.math.vector3(0, 64, 0), // root position
    api.math.vector3(0, 0, 1)   // pole (bend direction)
);
```

### Spider leg

```ts
const leg = api.ik.createSpiderLegChainWithPole(
    'leg_0',
    0.3, 0.5, 0.6,
    api.math.vector3(0, 64, 0),
    api.math.vector3(1, 0, 0)
);
```

## Drive a chain

```ts
chain.setTarget(api.math.vector3(1, 64.5, 0));
const state = chain.solveAndBroadcast();

console.log(state.targetReached, state.distanceToTarget);
```

## Attach to a model or entity

```ts
chain.attachToEntity(player.getUuid(), api.math.vector3(0, 1.2, 0));
// or:
// chain.attachToModel(modelId, api.math.vector3(0, 0, 0));
```

## Query + cleanup

```ts
api.ik.getChain('arm_left');
api.ik.getAllChains();
api.ik.getChainsForEntity(player.getUuid());

chain.remove();
api.ik.removeAll();
```

## Broadcast rate

If you have many chains, you can reduce network traffic:

```ts
api.ik.setDefaultBroadcastRate(2); // every 2 ticks (instead of every tick)
```

## solveOnce (no persistent chain)

Useful for previews or offline calculations:

```ts
const definition: IKChainDefinition = {
    id: 'preview',
    solverType: 'FABRIK',
    joints: [
        { name: 'a', length: 0.4 },
        { name: 'b', length: 0.4 }
    ]
};

const preview = api.ik.solveOnce(
    definition,
    api.math.vector3(0, 64, 0),
    api.math.vector3(1, 64.5, 0)
);
console.log(preview.jointPositions);
```

## raycastGround (helper)

This is a convenience raycast downwards against server chunk meshes:

```ts
const hit = api.ik.raycastGround({ position: api.math.vector3(0, 80, 0), maxDistance: 128 });
if (hit) console.log(hit.position, hit.normal);
```
