# Zones & Worlds


## Zones (trigger volumes)

Zones are axis-aligned boxes (AABBs). You define them with two corners; order doesn’t matter.

### Create a zone

```ts
api.zones.create(
  'spawn',
  api.math.vector3(-5, 64, -5),
  api.math.vector3(5, 72, 5),
  {
    onEnter: (player, zoneId) => player.sendMessage(`entered ${zoneId}`),
    onLeave: (player, zoneId) => player.sendMessage(`left ${zoneId}`)
  }
);
```

### Update callbacks (without changing the box)

```ts
api.zones.setCallbacks('spawn', {
  onEnter: (player) => player.sendMessage('welcome back'),
  onLeave: undefined
});
```

### Remove

```ts
api.zones.remove('spawn');
```

### Notes

- Zones are checked on player movement and on first spawn.
- Overlaps are allowed: if zones overlap, all matching zones can fire.
- A zone tracks a player as a **point** (player position), not a full bounding box.
- If you need “soft zones” (radius-based), implement it by distance checks in `setInterval`.

---

## World

`api.world` is the default world/instance you get on the server. It covers:

- generators (`setVoidGenerator`, `setFlatGenerator`)
- blocks (`getBlock`, `setBlock`)
- time (`setTime`, `setTimeRate`)
- world “objects” (models, displays, text, player models)
- raycasts (`api.world.raycast`)

### Example: void world + spawn platform

```ts
api.world.setVoidGenerator();
api.world.setSpawn(0, 64, 0);

for (let x = -4; x <= 4; x++) {
  for (let z = -4; z <= 4; z++) {
    api.world.setBlock(x, 63, z, 'minecraft:stone');
  }
}
```

### Time controls

```ts
api.world.setTime(6000);  // noon-ish
api.world.setTimeRate(0); // freeze time
```

### Persistence 

- The default world is stored at `.moud/scenes/default.polar` and is auto-saved periodically (default: every 60s).
- Configure autosave via `-Dmoud.scene.autosaveSeconds=...` (fallback: `-Dmoud.world.autosaveSeconds=...`).
- Legacy worlds at `.moud/worlds/default` are migrated automatically when `.moud/scenes/default.polar` is missing.

---

## Worlds (`api.worlds`)

`api.worlds` lets you create and manage additional worlds (Minestom instances).

### Load a world from disk

Paths can be absolute, or relative to the project root (where `package.json` lives).

```ts
// load an Anvil world folder
const anvilArena = api.worlds.loadWorld('arena', '.moud/worlds/arena');

// load a `.polar` world save file
const savedArena = api.worlds.loadWorld('arena2', '.moud/scenes/arena2.polar');

// override the scene id used for world metadata (only used for `.polar` saves)
api.worlds.loadWorld('arena3', '.moud/scenes/arena3.polar', 'arena3');
```

### Create a new world

```ts
const lobby = api.worlds.createWorld('lobby')
  .setVoidGenerator()
  .setSpawn(0.5, 64, 0.5);
```

### Teleport players into a world

```ts
api.on('player.join', (player) => {
  player.teleportToWorld('lobby');
});

// Or an explicit position
// player.teleportToWorld('arena', 0.5, 65, 0.5);
```

### Save / unload

```ts
api.worlds.saveWorld('arena');
api.worlds.saveAllWorlds();
api.worlds.unloadWorld('arena');
```

### Change the default world (new players spawn there)

```ts
api.worlds.setDefaultWorld('lobby');
```
