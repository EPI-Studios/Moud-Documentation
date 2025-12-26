# Global Client API

`Moud` is the client-side entry point exposed to scripts running inside the Fabric client mod.

There is **no** global `api` on the client. If you want to talk to the server, you go through `Moud.network`.

## What’s inside `Moud`

- `Moud.events` - lightweight client event bus (your own events + engine hooks)
- `Moud.network` - send/receive custom messages to/from the server
- `Moud.input` - keyboard/mouse polling + key hooks
- `Moud.ui` - UI creation (text/buttons/containers/images/inputs)
- `Moud.camera` - custom camera controller (cinematics, paths, look-at)
- `Moud.rendering` - client rendering helpers (render passes, framebuffers, render types)
- `Moud.cursor` - show/hide the system cursor
- `Moud.audio` - play sounds + microphone/voice helpers
- `Moud.shared` - client mirror of server shared values
- `Moud.gamepad` - poll gamepads and subscribe to changes

## Client ↔ server messages

### Send to server

```ts
Moud.network.sendToServer('ui:buy-item', { itemId: 'moud:sword_01' });
```

On the server you receive it with:

```ts
api.on('ui:buy-item', (player, data: { itemId: string }) => {
    player.sendMessage(`Buying: ${data.itemId}`);
});
```

### Listen to server events

```ts
Moud.network.on('boss:hp', (payload: { percent: number }) => {
    console.log('Boss HP', payload.percent);
});
```

## Input + UI

This is the “client UI sends intent, server validates” flow:

```ts
const buy = Moud.ui.createButton('Buy')
    .setPos(10, 10)
    .showAsOverlay();

buy.onClick(() => {
    Moud.audio.play({ id: 'minecraft:ui.button.click', volume: 0.8 });
    Moud.network.sendToServer('shop:buy', { itemId: 'moud:sword_01' });
});

Moud.input.onKey('key.keyboard.escape', (pressed) => {
    if (!pressed) return;
    buy.hideOverlay();
});
```

## Camera (client-side)

```ts
Moud.camera.enableCustomCamera();
Moud.camera.snapTo({
    position: Moud.camera.createVector3(0, 80, 0),
    yaw: 90,
    pitch: -20,
    fov: 70,
});

Moud.camera.transitionTo({
    position: Moud.camera.createVector3(10, 76, 10),
    yaw: 135,
    duration: 1200,
});

setTimeout(() => Moud.camera.disableCustomCamera(), 2000);
```


### audio.stop

```ts
stop(options: SoundStopOptions): void
```

Stops a sound that was previously started.

* **Example**:

```ts
Moud.audio.stop({ id: 'moud:ambient.rain' });
```

### audio.getMicrophone

```ts
getMicrophone(): ClientMicrophoneAPI
```

Returns an object used to start or stop microphone capture.

* **Example**:

```ts
const mic = Moud.audio.getMicrophone();
mic.start();
```

---

## Gamepad Helpers

### gamepad.onChange

```ts
onChange(callback: (snapshot: GamepadSnapshot) => void): string
```

Subscribes to gamepad updates.

* **Returns**:
  A listener id used for removal.

* **Example**:

```ts
const id = Moud.gamepad.onChange((snap) => {
    if (snap.buttons.find(b => b.name === 'start' && b.pressed)) {
        openMenu();
    }
});
```

### gamepad.removeListener

```ts
removeListener(listenerId: string): void
```

Removes a gamepad listener.

* **Example**:

```ts
Moud.gamepad.removeListener(id);
```
