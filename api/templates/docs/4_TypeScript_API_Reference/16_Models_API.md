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

### Collision

```ts
// Disable collisions entirely
statue.setCollisionBox(0, 0, 0);

// Change collision “shape mode” (string form is supported)
statue.setCollisionMode('STATIC_MESH');
```

### Physics helpers

Attach constraints:

```ts
// Follow an entity (uuid) with an offset
statue.attachToEntity(player.getUuid(), api.math.vector3(0, 2, 0), true);

// Spring tether (hanging lamp)
statue.attachSpring(api.math.vector3(0, 80, 0), 15, 0.8, 2.0);
```

Inspect physics state (only meaningful when physics is enabled):

```ts
const state = crate.getPhysicsState();
console.log(state.linearVelocity, state.onGround);
```

### Cleanup

```ts
statue.remove();
```
