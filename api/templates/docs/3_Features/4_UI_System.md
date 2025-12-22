
# UI System

Moud’s UI layer is rendered entirely on the client (Fabric mod). Server scripts own the data, client scripts own the widgets. Components feel familiar if you know flexbox or react-style trees stuff, but they are lightweight TypeScript objects backed by immediate-mode rendering.



## Two Entry Points

- **Server:** `player.ui`, `player.window`, and `player.getClient().send(...)`. Use these to instruct a client to open/close views or to seed initial state. The actual layout lives on the client side, but you can still trigger toasts or OS window transitions directly from the server.
- **Client:** `Moud.ui` factory functions (`createContainer`, `createText`, etc.) plus services for screen metrics, focus, and mouse input. This runs under GraalVM with access to `Shared Values`, audio, and networking APIs.

## Example: Mana HUD

Server:

```ts
api.on('player.join', (player) => {
  const stats = player.getShared().getStore('playerUI');
  stats.set('mana', 80);
  stats.set('maxMana', 100, 'batched', 'server_only');

  player.getClient().send('hud:ready', { version: 1 });
});
```

Client:

```ts
const stats = Moud.shared.getStore('playerUI');

const panel = Moud.ui.createContainer()
  .setPos(16, 16)
  .setSize(180, 36)
  .setBackgroundColor('#000000aa')
  .setPadding(8, 8, 8, 8)
  .setGap(6)
  .setFlexDirection('column')
  .showAsOverlay();

const bar = Moud.ui.createContainer()
  .setSize(164, 8)
  .setBackgroundColor('#1f2933');

const fill = Moud.ui.createContainer()
  .setSize(164, 8)
  .setBackgroundColor('#38bdf8');

const label = Moud.ui.createText('Mana 80 / 100').setTextColor('#ffffff');

panel.appendChild(label);
panel.appendChild(bar);
bar.appendChild(fill);

function refresh() {
  const mana = stats.get('mana') ?? 0;
  const max = stats.get('maxMana') ?? 100;
  fill.setWidth(164 * (mana / max));
  label.setText(`Mana ${mana} / ${max}`);
}

stats.onChange('mana', refresh);
stats.onChange('maxMana', refresh);
refresh();
```

## Component Toolkit

| Factory | Description |
| --- | --- |
| `createContainer()` | Flexbox-like container. Supports `setFlexDirection`, `setAlignItems`, `setJustifyContent`, `setGap`, `setPadding`, `setScroll`, etc. |
| `createText(content?)` | Text label with `setFont`, `setTextColor`, `setTextAlign`, `setShadow`. |
| `createImage(source)` | Displays any texture (e.g., `minecraft:textures/gui/icons.png`) or streamed asset. |
| `createButton(label)` | Styled container that exposes `.onClick`, `.onHover`, `.setDisabled`. |
| `createInput(placeholder)` | Text input field with `.onChange`, `.onSubmit`, `.setMaxLength`. |
| `createProgress()` | Prebuilt horizontal progress bar. |

Common methods shared by all components:

| Method | Purpose |
| --- | --- |
| `setPos(x, y)` / `setSize(w, h)` | Absolute layout relative to the game window. |
| `setBackgroundColor('#RRGGBBAA')` | Transparent colours supported. |
| `setBorder(width, color)` | Outline around the component. |
| `setOpacity(0..1)` | Global alpha multiplier. |
| `showAsOverlay()` / `hideOverlay()` | Adds/removes the component from the overlay root. |
| `remove()` | Destroys the component and detaches listeners. |

### Events & Focus

- `component.onClick((component, mouse) => {...})`
- `component.onHover((component, hovering) => {...})`
- `component.onKey((component, keyCode, modifiers) => {...})`
- `component.captureFocus()` / `component.releaseFocus()`

 When an input has focus, keystrokes no longer reach Minecraft chat until you release them.

## Handling Different Screen Sizes

`Moud.ui.getScreenWidth()` / `getScreenHeight()` return the scaled GUI resolution. Listen to `render:resize` events (emitted by the client runtime) to recompute layouts:

```ts
function layout() {
  const width = Moud.ui.getScreenWidth();
  panel.setPos(width / 2 - panel.getWidth() / 2, 40);
}

layout();
Moud.events.on('render:resize', () => layout());
```

## Server-driven Windows

`player.window` lets you animate the OS window (move/resize/fade) for desktop builds:

```ts
player.window.transitionTo({
  duration: 800,
  easing: 'ease_out',
  width: 1280,
  height: 720
});
```



