# Worlds 

`api.world` is “the default world”.  
`api.worlds` is the **world/instance manager**: create/load/save/unload multiple worlds.

This is the API you use when you want:

- separate arenas or minigame instances
- a “build world” you prepare off-screen
- loading/saving real Minecraft worlds from disk

## Create a new world

```ts
const arena = api.worlds.createWorld('arena');

arena.setVoidGenerator();
arena.setSpawn(0, 64, 0);
arena.setBlock(0, 63, 0, 'minecraft:bedrock');
```

## Load an existing world from disk

```ts
// anvil world folder
const map = api.worlds.loadWorld('arena', 'worlds/arena');

// world save file (.polar)
const saved = api.worlds.loadWorld('arena_saved', '.moud/scenes/arena_saved.polar');
```

Notes about `path`:

- absolute paths work
- relative paths are resolved against your project root (and a couple of fallbacks)

## Shared worlds

`createSharedWorld(name, parentWorldName)` creates a Minestom `SharedInstance` that shares chunks with a parent instance.

This is great for:

- multiple “views” of the same map
- isolated gameplay logic without duplicating chunk memory

```ts
const base = api.worlds.createWorld('base');
const shard = api.worlds.createSharedWorld('base_shard', 'base');
```

Important limitation: generator/spawn helpers like `setVoidGenerator()` and `setSpawn()` only work on container worlds (not shared instances).

## Save / unload

```ts
api.worlds.saveWorld('arena');
api.worlds.saveAllWorlds();

api.worlds.unloadWorld('arena');
```

## Existence + lookup

```ts
if (!api.worlds.worldExists('arena')) {
    api.worlds.createWorld('arena');
}

const arena = api.worlds.getWorld('arena');
const def = api.worlds.getDefaultWorld();
```

## Teleporting players into worlds

Use `player.teleportToWorld(...)` to move a player into a loaded world instance.

```ts
api.on('player.join', (player) => {
    player.teleportToWorld('arena');
});

// Or an explicit position
// player.teleportToWorld('arena', 0.5, 65, 0.5);
```

## Default world

`api.worlds.setDefaultWorld(name)` changes where new players spawn.

```ts
api.worlds.setDefaultWorld('arena');
```
