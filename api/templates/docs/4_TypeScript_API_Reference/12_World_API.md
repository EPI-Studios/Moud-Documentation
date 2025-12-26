# World

`api.world` is the default world/instance you get on the server. It covers:

- Blocks + time
- Raycasts
- Spawning “world objects” you can control from scripts: text, displays, player models, 3D models

If you need multiple worlds/instances, use `api.worlds` (see `docs/4_TypeScript_API_Reference/15_Worlds_API.md`).

## Setup

```ts
api.world.setVoidGenerator();
api.world.setSpawn(0, 64, 0);
```

## Blocks

```ts
api.world.setBlock(0, 60, 0, 'minecraft:diamond_block');
const id = api.world.getBlock(0, 60, 0);
```

## Raycast

```ts
const hit = api.world.raycast({
    origin: player.getPosition(),
    direction: player.getCameraDirection(),
    maxDistance: 64,
    ignorePlayer: player
});

if (hit.didHit) {
    if (hit.blockType) {
        api.server.broadcast(`Hit block ${hit.blockType}`);
    } else if (hit.model) {
        api.server.broadcast(`Hit model id=${hit.model.getId()} path=${hit.model.getModelPath()}`);
    } else if (hit.entity) {
        api.server.broadcast(`Hit player ${hit.entity.getName()}`);
    }
}
```

## Time

```ts
api.world.setTime(6000);        // noon-ish
api.world.setTimeRate(0);       // freeze
api.world.setTimeRate(1);       // normal
api.world.setTimeSynchronizationTicks(20); // client sync every second
```

## World objects

### Text (`createText`)

```ts
const label = api.world.createText({
    position: api.math.vector3(5.5, 67, 5.5),
    content: 'Hello',
    billboard: 'center',
    shadow: true,
    backgroundColor: 0xAA000000,
    hitbox: { width: 2.5, height: 1.2 }
});

label.setText('Updated');
label.setColor(0, 255, 128);
label.setBackgroundColor(0x66000000);
```

### Media display (`createDisplay`)

```ts
const screen = api.world.createDisplay({
    position: api.math.vector3(-2, 68, 4),
    scale: api.math.vector3(4, 2.25, 0.2),
    rotation: api.math.quaternionFromEuler(0, 90, 0),
    anchor: { type: 'block', x: -2, y: 65, z: 4, offset: api.math.vector3(0.5, 3, 0) },
    content: { type: 'frames', frames: ['moud:textures/a.png', 'moud:textures/b.png'], fps: 2, loop: true },
    playback: { playing: true, speed: 1.0 }
});

screen.pause();
screen.play();
```

### NPC (`createPlayerModel`)

```ts
const npc = api.world.createPlayerModel({
    position: api.math.vector3(0, 64, 0),
    skinUrl: 'https://…/skin.png',
    rotation: api.math.vector3(0, 180, 0) // pitch=x, yaw=y
});

npc.walkTo(api.math.vector3(10, 64, 10), { speed: 2.0 });
```

### 3D model (`createModel` / `createPhysicsModel`)

```ts
const statue = api.world.createModel({
    model: 'moud:models/statue.obj',
    texture: 'moud:textures/statue.png',
    position: api.math.vector3(2, 65, -3),
    rotation: api.math.quaternionFromEuler(0, 45, 0),
    scale: api.math.vector3(1.2, 1.2, 1.2),
    collision: { width: 1.2, height: 2.4, depth: 1.0 }
});

const crate = api.world.createPhysicsModel({
    model: 'moud:models/crate.obj',
    position: api.math.vector3(0, 80, 0),
    physics: { mass: 5, playerPush: true }
});
```

## Scripted entities

If you need a Minestom entity that calls back into JS each tick:

```ts
api.world.spawnScriptedEntity('minecraft:zombie', 0, 64, 0, {
    onTick: () => {
        // called each server tick
    }
});
```
