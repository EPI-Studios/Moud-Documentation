# Event System

Moud’s scripting surface is entirely event-driven. Instead of building your own game loop, you register callbacks with `api.on(eventName, handler)` and let the engine feed you fully-typed proxies (players, chat events, cursor deltas, etc.) straight from Minestom or the client runtime.

```ts
api.on('player.join', (player) => {
  player.sendMessage('Welcome to Moud!');
  player.cursor.setColor(0.2, 0.8, 1.0);
});

api.on('player.chat', (event) => {
  const player = event.getPlayer();
  const text = event.getMessage().trim();
  if (text === '!ping') {
    event.cancel();               // stop vanilla broadcast
    player.sendMessage('pong!');
  }
});
```

Behind the scenes, `EventDispatcher` listens to Minestom events, normalises them via `EventConverter`, wraps them in proxies, and executes your callback inside Graal with profiling metadata.

## Built-in Events

| Category | Event | Arguments | Notes |
| --- | --- | --- | --- |
| Lifecycle | `server.load` | none | Fired once after all managers, bundles, and assets are ready. Perfect place to run bootstrap logic. |
| Handshake | `moud.player.ready` | `PlayerProxy` | Fires when the Fabric client finished downloading bundles and reported readiness. |
| Presence | `player.join`, `player.leave` | `PlayerProxy`, `PlayerLeaveEvent` | `player.join` triggers only on first spawn (after login & dimension assignment). |
| Chat & Commands | `player.chat` | `ChatEventProxy` | Provides `.cancel()` plus message & player references. |
| Movement | `player.move`, `player.movement_state` | `PlayerMoveEventProxy`, `(PlayerProxy, movementData)` | `player.movement_state` receives a second argument describing input buttons coming from the custom movement packet. |
| Movement helpers | `player.jump`, `player.land`, `player.airborne`, `player.movement.start`, `player.movement.stop`, `player.sprint.start/stop`, `player.sneak.start/stop` | `PlayerProxy` | Emitted by `ServerMovementHandler` after analysing input flags. |
| Mouse/Input | `player.mousemove`, `player.click` | `(PlayerProxy, { deltaX, deltaY })`, `(PlayerProxy, { button })` | Mouse data originates from the Fabric mod, so it works even when the camera is detached. |
| Blocks | `block.break`, `block.place` | `BlockEventProxy` | Wraps Minestom’s block events with position, block id, and `.cancel()`. |
| Entities | `entity.interact` | `EntityInteractionProxy` | Covers both right- and left-click interactions with scripted entities. |
| Custom | any string sent via `ClientProxy.send()` or `Moud.network.sendToServer()` | depends | Lets you define your own event namespaces (e.g., `ui:button_press`, `audio:microphone:chunk`). |

```hint info Proxies vs raw events
Every argument you receive is a safe proxy (`PlayerProxy`, `ChatEventProxy`, etc.). They expose only the methods supported by the TypeScript SDK, so you never manipulate Minestom internals directly.
```

## Cancellable Events

`ChatEventProxy`, `BlockEventProxy`, and future intent-based events implement `.cancel()` and other helpers. Use them to override vanilla behaviour:

```ts
api.on('block.break', (event) => {
  if (event.getBlock().includes('diamond')) {
    event.cancel();
    event.getPlayer().sendMessage('lmao not with bare hands');
  }
});
```

## Client ↔ Server Custom Events

The scripting APIs expose two symmetrical helpers.

### Client → Server

```ts
// client/hud.ts
function onButtonClick() {
  Moud.network.sendToServer('ui:button_click', { buttonId: 'start' });
}
```

```ts
// src/main.ts
api.on('ui:button_click', (player, payloadJson) => {
  const data = JSON.parse(payloadJson);
  if (data.buttonId === 'start') {
    startGameFor(player);
  }
});
```

The Fabric mod serialises the payload, sends it over the `moud:wrapper` channel, `ServerNetworkManager` unwraps it, and `EventDispatcher` invokes your handler.

### Server → Client

```ts
api.on('player.join', (player) => {
  player.getClient().send('hud:show', {
    title: 'Demo HUD',
    sharedStore: 'playerUI'
  });
});
```

Client scripts listen via `Moud.network.on('hud:show', (payload) => { ... })` (see the UI part in the documentation). This is how lighting updates, audio commands, cursor state, and other server-driven systems reach the client runtime.

## Profiling & Diagnostics

- Every callback is wrapped with `ScriptExecutionMetadata`, so enabling the profiler (`moud dev --profile-ui`) shows how long each event handler takes.
- `SharedValueInspectCommand` (`/sharedinspect`) dumps shared store state per player, so you can verify your events mutate the expected keys.
- `DevUtilities` also expose `/networkprobe` to track custom event traffic in real time.

With these infromations you can build the rest of your gameplay loop merely by reacting to events and pushing data through Shared Values or custom messages.
