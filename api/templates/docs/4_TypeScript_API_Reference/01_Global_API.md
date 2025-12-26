# Global Server API

`api` is the server-side entry point exposed to TypeScript scripts running in the Minestom runtime.

If you only remember one rule: **use `api` on the server** (even though `Moud` also exists server-side). That avoids mixing server APIs with client-only helpers like `Moud.ui` or `Moud.input`.

## What’s inside `api`

- `api.on / once / off` - event hooks (built-in + custom)
- `api.server` - broadcast, player list, console commands
- `api.world` - blocks, time, raycasts, world objects (text, displays, models)
- `api.worlds` - multi-world manager (create/load/save/unload instances)
- `api.physics` - player physics + Jolt constraints
- `api.zones` - trigger volumes (enter/leave)
- `api.particles` - particle spawns + emitters
- `api.ik` - inverse kinematics chains
- `api.primitives` - basic debug geometry (cubes/lines/etc)
- `api.assets` - load shaders/textures/data bundled in your datapack
- `api.camera` - scene camera registry + assign a camera to a player
- `api.scene` - access (and edit) the active editor scene snapshot
- `api.async` - off-thread work + hop back to the server thread
- `api.math` - vectors, quaternions, matrices, utility math

## Events

### Listening (`on`)

Built-in events have real types, so prefer them over `string` when you can:

```ts
api.on('player.join', (player) => {
    player.sendMessage('Welcome to Moud.');
});

api.on('player.chat', (event) => {
    const player = event.getPlayer();
    const msg = event.getMessage();

    if (msg === '!ping') {
        event.cancel();
        player.sendMessage('pong');
    }
});
```

### One-shot (`once`) and cleanup (`off`)

```ts
const handler = (player: Player) => player.sendMessage('first time only');

api.once('player.join', handler);
// If you used `api.on(...)`, you can remove with:
// api.off('player.join', handler);
```

### Custom events (from clients)

On the client you send with `Moud.network.sendToServer(...)`. On the server you receive as `(player, data)`:

```ts
api.on('ui:buy-item', (player, data: { itemId: string }) => {
    player.sendMessage(`Buying: ${data.itemId}`);
});
```

## Quick examples

### Raycast and place a block

```ts
api.on('player.click', (player) => {
    const hit = api.world.raycast({
        origin: player.getPosition(),
        direction: player.getCameraDirection(),
        maxDistance: 64,
        ignorePlayer: player
    });

    if (hit.didHit && hit.blockType) {
        api.world.setBlock(
            Math.floor(hit.position.x),
            Math.floor(hit.position.y),
            Math.floor(hit.position.z),
            'minecraft:gold_block'
        );
    }
});
```

`hit.model` is set when you hit a 3D model created with `api.world.createModel(...)`.

### Create a trigger zone

```ts
api.zones.create(
    'lobby',
    api.math.vector3(0, 64, 0),
    api.math.vector3(12, 72, 12),
    {
        onEnter: (p) => p.sendMessage('Welcome to the lobby'),
        onLeave: (p) => p.sendMessage('Leaving the lobby')
    }
);
```

### Register a command

```ts
api.commands.register('spawn', (player) => {
    player.teleport(0, 64, 0);
});
```

### Physics constraint (distance)

```ts
api.on('player.join', (player) => {
    api.physics.setPlayerPhysics(player, true);

    const crate = api.world.createPhysicsModel({
        model: 'moud:models/crate.obj',
        position: api.math.vector3(0, 70, 0),
        physics: { mass: 5, playerPush: true }
    });

    const rope = api.physics.createDistanceConstraint({
        a: player,
        b: crate,
        maxDistance: 4
    });

    player.sendMessage(`constraint id=${rope}`);
});
```

## Where to go next

- World objects + blocks: `docs/4_TypeScript_API_Reference/12_World_API.md`
- Multi-world manager: `docs/4_TypeScript_API_Reference/15_Worlds_API.md`
- Client entrypoint (`Moud`): `docs/4_TypeScript_API_Reference/02_Global_Moud.md`
- Commands + players: `docs/4_TypeScript_API_Reference/14_Commands_and_Players.md`
- Assets: `docs/4_TypeScript_API_Reference/13_Assets_API.md`
- Async: `docs/4_TypeScript_API_Reference/22_Async_API.md`
- Camera control: `docs/4_TypeScript_API_Reference/05_Input_and_Camera.md`
