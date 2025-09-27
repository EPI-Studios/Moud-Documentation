# The Event System

Moud's architecture is fundamentally **event-driven**. Your code does not run in a loop; instead, it reacts to events that occur in the game. This is the primary way to add interactivity to your world.

## Listening for an Event

The main method for listening to an event is `api.on()`. It takes the event name as its first argument and a callback function as its second.

```typescript


// Log a message every time a player joins
api.on('player.join', (player) => {
  console.log(`${player.getName()} joined the server!`);
  player.sendMessage('Welcome!');
});

// Handle chat messages
api.on('player.chat', (event) => {
  const player = event.getPlayer();
  const message = event.getMessage();

  console.log(`[${player.getName()}]: ${message}`);
});
```
  

### Server-Side Events

| Event Name              | Description                                                   | Callback Argument(s)                |
|-------------------------|---------------------------------------------------------------|-------------------------------------|
| `player.join`           | Fired when a player enters the world (first spawn).           | PlayerSpawnEvent                    |
| `player.leave`          | Fired when a player disconnects.                              | PlayerDisconnectEvent               |
| `player.chat`           | Fired when a player sends a chat message.                     | PlayerChatEvent                     |
| `player.click`          | Fired when a player clicks a button (mouse).                  | PlayerProxy, {button}               |
| `player.mousemove`      | Fired when the player moves the mouse (deltaX/Y).             | PlayerProxy, {deltaX, deltaY}       |
| `player.movement_state` | Fired when a movement packet updates all movement inputs.     | PlayerProxy, {forward, backward, left, right, jumping, sneaking, sprinting, onGround, speed} |
| `player.jump`           | Fired when a player jumps.                                    | PlayerProxy                         |
| `player.sneak.start`    | Fired when a player starts sneaking.                          | PlayerProxy                         |
| `player.sneak.stop`     | Fired when a player stops sneaking.                           | PlayerProxy                         |
| `player.sprint.start`   | Fired when a player starts sprinting.                         | PlayerProxy                         |
| `player.sprint.stop`    | Fired when a player stops sprinting.                          | PlayerProxy                         |
| `player.movement.start` | Fired when a player starts moving (any direction).            | PlayerProxy                         |
| `player.movement.stop`  | Fired when a player stops moving.                             | PlayerProxy                         |
| `player.land`           | Fired when a player lands on the ground.                      | PlayerProxy                         |
| `player.airborne`       | Fired when a player leaves the ground (jump/fall).            | PlayerProxy                         |
| `entity.interact`       | Fired when a player interacts with an entity.                 | EntityInteractionProxy              |
| `script.event`          | Fired manually from scripts.                                  | PlayerProxy, String eventData       |
| `block.break`           | Fired when a player breaks a block.                           | PlayerBlockBreakEvent               |
| `block.place`           | Fired when a player places a block.                           | PlayerBlockPlaceEvent               |

## Cancellable Events

Some events represent a player's "intent," such as sending a message or breaking a block. You can prevent the default action from occurring by using the .cancel() method.

```hint warning "Cancelling an Event"  
Calling event.cancel() will stop the vanilla Minecraft behavior. For example, if you cancel a player.chat event, the message will never appear in public chat, allowing you to process it as a custom command instead for example.  
```

For example
```typescript
// src/main.ts
api.on('player.chat', (event) => {
  const message = event.getMessage();

  if (message.startsWith('!')) {
    // prevent the command message from appearing in chat
    event.cancel();

    const player = event.getPlayer();
    if (message === '/heal') {
      // command logic
      player.sendMessage('You have been healed!');
    }
  }
});
```
  

## Custom Events (Client -> Server)

Your client script can send data to the server, which will trigger a custom event.

**Client-Side:**

```typescript
// client/main.ts
// Assume the player clicks a UI button
function onButtonClick() {
  moudAPI.network.sendToServer('ui:button_click', { buttonId: 'start_game' });
}
```
  
**Server-Side:**

```typescript
// src/main.ts
api.on('ui:button_click', (player, data) => {
  console.log(`Player ${player.getName()} clicked a button.`);
  if (data.buttonId === 'start_game') {
    // do the stuff it's supposed to do
  }
});
```
  

