# Models

Moud’s model API is a server-side way to spawn custom 3D meshes (OBJ) and then move/skin them from scripts.

You create them from a `World`:

- `api.world.createModel(...)` → static model
- `api.world.createPhysicsModel(...)` → model + physics body

## createModel

```ts
const statue = api.world.createModel({
    model: 'moud:models/statue.obj',
    texture: 'moud:textures/statue.png',
    position: api.math.vector3(2, 65, -3),
    rotation: api.math.quaternionFromEuler(0, 45, 0),
    scale: api.math.vector3(1.2, 1.2, 1.2),
    collision: { width: 1.2, height: 2.4, depth: 1.0 }
});
```

`collision` can be:

- `true` → auto box inferred from scale
- `false` → no collision box
- `{ width, height, depth }` → explicit box

## createPhysicsModel

```ts
const crate = api.world.createPhysicsModel({
    model: 'moud:models/crate.obj',
    position: api.math.vector3(0, 80, 0),
    physics: {
        mass: 5,
        linearVelocity: api.math.vector3(2, 0, 0),
        playerPush: true
    }
});
```

## Controlling a `Model`

### Transform

```ts
statue.setPosition(api.math.vector3(0, 64, 0));
statue.setRotationFromEuler(0, 180, 0);
statue.setScale(api.math.vector3(2, 2, 2));

// or all-at-once:
statue.setTransform(
    api.math.vector3(0, 64, 0),
    api.math.quaternionFromEuler(0, 90, 0),
    api.math.vector3(1, 1, 1)
);
```

### Texture override

```ts
statue.setTexture('moud:textures/statue_glow.png');
```

### Collision + collision mode

Collision bounds are configured at spawn time via `createModel({ collision: ... })` / `createPhysicsModel({ collision: ... })`.

At runtime, you can still hint how the server should treat collisions with:

```ts
// Change collision “shape mode” (string form is supported)
statue.setCollisionMode('mesh');
```

If you need to change the actual collision bounds, recreate the model with different `collision` options.

### Anchoring (parenting transforms)

Models can be anchored to blocks, entities/players, or other models. You can do this at spawn time with `anchor`, or at runtime with the `setAnchor...` methods.

```ts
// follow a player with a local offset (simple overload)
statue.setAnchorToPlayer(player, api.math.vector3(0, 2.0, 0));

// anchor to an entity UUID with full control
statue.setAnchorToEntity(
    player.getUuid(),
    api.math.vector3(0, 2.0, 0),
    api.math.quaternionFromEuler(0, 0, 0),
    api.math.vector3(1, 1, 1),
    true,
    true,
    false,
    true
);
```

Clear the anchor:

```ts
statue.clearAnchor();
```

### Physics helpers (for physics models)

Physics is server-side. Use `api.physics` to apply impulses or read/write velocities:

```ts
api.physics.applyImpulse(crate, api.math.vector3(0, 6, 0));
api.physics.setLinearVelocity(crate, api.math.vector3(2, 0, 0));
console.log(api.physics.getLinearVelocity(crate));
```

### Cleanup

```ts
statue.remove();
```
