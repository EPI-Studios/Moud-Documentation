# Gamepad

Gamepad polling and change listeners exposed via `Moud.gamepad`.

## Connection and presence

```ts
Moud.gamepad.isConnected(0); // boolean
```

## Reading state

`getState(index)` returns a `GamepadSnapshot` (or `null`), and the snapshot uses **getters**:

```ts
const snapshot = Moud.gamepad.getState(0);
if (!snapshot || !snapshot.isConnected()) return;

const axes = snapshot.getAxes();       // number[]
const buttons = snapshot.getButtons(); // boolean[]

const [lx, ly] = axes;          // left stick
const pressedA = buttons[0];    // button 0 (A / Cross on most pads)
```

## Change listeners

```ts
const id = Moud.gamepad.onChange((snapshot) => {
    if (!snapshot.isConnected()) return;

    const buttons = snapshot.getButtons();
    if (buttons[7]) {
        console.log('RT/R2 pressed');
    }
});

// later
Moud.gamepad.removeListener(id);
```

## Vibration toggle

Moud can expose vibration/haptics depending on platform capabilities. You can disable it globally:

```ts
Moud.gamepad.setVibrationEnabled(false);
console.log('vibration enabled?', Moud.gamepad.isVibrationEnabled());
```
