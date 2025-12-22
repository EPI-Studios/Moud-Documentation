# Networking

Custom event transport between client scripts and the server via `Moud.network`.

## Client → Server

### sendToServer
```ts
sendToServer(eventName: string, data?: unknown): void
```
Packages a payload and sends it to the server scripting runtime over a custom channel.

- **Parameters**: 
  - `eventName`: Identifier for the event channel.
  - `data`: JSON-serializable object payload (optional).
- **Returns**: `void`.
- **Example**:
```ts
Moud.network.sendToServer('client:ready', { ready: true, ts: Date.now() });
```

## Server → Client

### on
```ts
on(eventName: string, callback: (payload: any) => void): void
```
Registers a listener for server-sent custom events.

- **Parameters**: 
  - `eventName`: Identifier for the event channel to subscribe to.
  - `callback`: Function receiving the deserialized payload.
- **Returns**: `void`.
- **Example**:
```ts
Moud.network.on('server:state', (data) => {
    updateScoreboard(data.players);
    showPhaseBanner(data.phase);
});
```

## Code Sample
```ts
// client-side networking

// Send an input event to the server
Moud.input.onKey('key.keyboard.p', (pressed) => {
    if (pressed) {
        Moud.network.sendToServer('client:ping', { ts: Date.now() });
    }
});

// Receive server responses
Moud.network.on('server:pong', (payload) => {
    const toast = Moud.ui.createText('PONG!');
    toast.setPos(10, 50).setBackgroundColor('#66000000').showAsOverlay();
});
```