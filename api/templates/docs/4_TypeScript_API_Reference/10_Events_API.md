# Events

Server-side event bus (`api`) and client-side event bus (`Moud.events`).

## Server Event Bus

### api.on
```ts
on(eventName: string, callback: (...args: unknown[]) => void): void
```
Registers a persistent server-side listener for built-in or custom events.

- **Parameters**: 
  - `eventName`: Identifier for the event (e.g., `player.join`, `block.break`, `entity.interact`).
  - `callback`: Function to execute when the event fires.
- **Returns**: `void`.
- **Example**:
```ts
api.on('player.click', (player, hit) => {
    if (hit?.block) {
        player.sendMessage(`You clicked ${hit.block.name}`);
    }
});
```

### api.once
```ts
once(eventName: string, callback: (...args: unknown[]) => void): void
```
Registers a listener that automatically removes itself after the first execution.

- **Parameters**: 
  - `eventName`: Identifier for the event.
  - `callback`: Function to execute once.
- **Returns**: `void`.
- **Example**:
```ts
api.once('player.join', (player) => {
    player.sendMessage('Welcome to the server!');
});
```

### api.off
```ts
off(eventName: string, callback: (...args: unknown[]) => void): void
```
Removes a previously registered listener. The callback passed must be the exact reference used during registration.

- **Parameters**: 
  - `eventName`: Identifier for the event.
  - `callback`: The function reference to remove.
- **Returns**: `void`.
- **Example**:
```ts
function onChat(player, message) {
    console.log(message);
}

api.on('player.chat', onChat);
// Later...
api.off('player.chat', onChat);
```

## Client Event Bus

### Moud.events.on
```ts
on(eventName: string, callback: (...args: unknown[]) => void): void
```
Registers a listener for client-side events, such as render loops or UI updates.

- **Parameters**: 
  - `eventName`: Identifier for the event (e.g., `render:hud`, `render:world`).
  - `callback`: Function to execute.
- **Returns**: `void`.
- **Example**:
```ts
Moud.events.on('render:hud', (context, tickDelta) => {
    const text = Moud.ui.createText(`Delta: ${tickDelta.toFixed(2)}`);
    text.setPos(10, 10).showAsOverlay();
});
```

### Moud.events.dispatch
```ts
dispatch(eventName: string, ...args: unknown[]): void
```
Immediately triggers a client-side event, passing provided arguments to all registered listeners.

- **Parameters**: 
  - `eventName`: Identifier to trigger.
  - `...args`: Data to pass to listeners.
- **Returns**: `void`.
- **Example**:
```ts
Moud.events.dispatch('ui:toast', { title: 'Quest Updated', body: 'Return to town' });
```