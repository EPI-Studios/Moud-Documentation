# Command System

Server-side command registration and execution exposed through the TS API (`api.commands` and `api.server`).

## Registration

### register
```ts
register(name: string, callback: (player: Player) => void): void
```
Adds a chat command that runs server-side logic when typed by a player.

- **Parameters**: 
  - `name`: The command string (without the `/`).
  - `callback`: Function receiving the invoking `Player`.
- **Returns**: `void`.
- **Example**:
```ts
api.commands.register('spawn', (player) => {
    player.teleport(0, 64, 0);
    player.sendMessage('Teleported to spawn!');
});
```

### registerWithAliases
```ts
registerWithAliases(name: string, aliases: string[], callback: (player: Player) => void): void
```
Same as `register`, but allows defining alternative names for the same command.

- **Parameters**: 
  - `name`: The primary command name.
  - `aliases`: A list of alternative names (e.g., `['yell', 'scream']`).
  - `callback`: Function receiving the invoking `Player`.
- **Returns**: `void`.
- **Example**:
```ts
api.commands.registerWithAliases('shout', ['yell'], (player) => {
    api.server.broadcast(`[${player.getName()}] says hello!`);
});
```

---

# Server API (`api.server`)

Server-wide helpers for broadcasting messages, enumerating players, and running console commands.

## Broadcast

```ts
api.server.broadcast('Hello world');
api.server.broadcastActionBar('Wave!');
```

## Player list + lookup

```ts
api.server.getPlayerCount();
api.server.getPlayers();
api.server.getPlayerNames();

api.server.getPlayer('Notch');
api.server.getPlayerByUuid('00000000-0000-0000-0000-000000000000');
api.server.hasPlayer('Notch');
```

## Run a console command

```ts
api.server.runCommand('time set day');
```

---

# Player API (server-side)

When you get a `Player` (from events, commands, or `api.server.getPlayers()`), you can:

- message/kick/teleport
- switch worlds (instances)
- read position + look direction
- drive client-side features through proxies (`player.camera`, `player.window`, `player.audio`, etc.)

## Basics

```ts
player.getName();
player.getUuid();

player.sendMessage('Hello');
player.kick('bye');
player.teleport(0, 64, 0);

player.teleportToWorld('lobby');
// player.teleportToWorld('arena', 0.5, 65, 0.5);
```

## Position + look

```ts
const pos = player.getPosition();
const headDir = player.getDirection();        // works on vanilla + modded
const camDir = player.getCameraDirection();   // best with Moud client mod
```

## Movement state

```ts
player.isWalking();
player.isRunning();
player.isSneaking();
player.isJumping();
player.isOnGround();
player.isMoving();
```

## Client movement info (client-mod-only)

These values are reported by the client mod:

```ts
player.getMovementType();
player.getMovementDirection();
player.getMovementSpeed();
```

## Vanish

```ts
player.setVanished(true);
```

## Client bridge (`player.getClient()`)

Use this when you want the client to do something visual (UI, particles, etc.) and you want to send *data* to a client script:

```ts
player.getClient().send('ui:toast', { text: 'Hello from server' });
```

## Camera (`player.camera`)

Server-driven cinematics (sends packets to the client):

```ts
player.camera.lock(api.math.vector3(0, 80, 0), { yaw: 180, pitch: -25 });
player.camera.smoothTransitionTo(api.math.vector3(0, 75, 20), { yaw: 180, pitch: -10 }, 2000);
setTimeout(() => player.camera.release(), 2500);
```

Full camera doc: `docs/4_TypeScript_API_Reference/05_Input_and_Camera.md`

## HUD visibility (`player.ui`)

```ts
player.ui.hide({ chat: true, crosshair: true });
player.ui.show();
```

## Window control (`player.window`)

Window control is client-mod-only, but when available you can do things like:

```ts
player.window.setTitle('Moud');
player.window.transitionTo({ width: 1280, height: 720, duration: 500 });
```

## Audio (`player.audio` / `player.getAudio()`)

Server-driven sound + voice helpers (plays on the client):

```ts
player.audio.play({ id: 'ui:click', sound: 'minecraft:ui.button.click', volume: 0.8 });
```
