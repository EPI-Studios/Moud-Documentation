# Cursor & Interaction

The `CursorService` hooks raw mouse movement from the Fabric mod, raycasts against blocks and scripted entities on the server, and exposes a high-level API through `player.cursor`.



Available methods:

| Method | Description |
| --- | --- |
| `getPosition()` | Returns the world-space intersection point (`Vector3`). |
| `getNormal()` | Normal vector at the hit location. |
| `isHittingBlock()` | Boolean; `false` when only entities/void are under the cursor. |
| `setMode('TWO_DIMENSIONAL' | 'THREE_DIMENSIONAL')` | Switch between block/grid projection or raw ray. |
| `setVisible(boolean)` / `setVisibleTo(players)` / `hideFrom(players)` | Control per-viewer visibility. |
| `setTexture(path)` | 16×16 or higher PNG located in your assets. |
| `setColor(r, g, b)` | Tint. |
| `setScale(f)` | Adjusts rendered size. |
| `projectOntoBlock(bool)` | Force the cursor to stick to block faces for grid-based editors. |

`setVisibleTo` accepts either a single `PlayerProxy` or an array.

## Input Events

Register for low-level mouse data:

```ts
api.on('player.mousemove', (player, delta) => {
  // delta.deltaX / delta.deltaY since last tick
});

api.on('player.click', (player, data) => {
  if (data.button === 0 && player.cursor.isHittingBlock()) {
    placeMarker(player.cursor.getPosition());
  }
});
```

`player.movement_state` (documented in the Events chapter) complements these events when you need to know if the player is actively moving while interacting.

## Entity Interaction

When the cursor hovers or clicks on scripted entities, `CursorService` emits `entity.interact` events with detailed context:

```ts
api.on('entity.interact', (event) => {
  if (!event.isClick()) return;
  const player = event.getPlayer();
  player.sendMessage(`You clicked entity ${event.getEntityUuid()}`);
});
```

Hover enter/exit events fire automatically so you can implement tooltips:

```ts
api.on('entity.interact', (event) => {
  if (event.isHoverEnter()) {
    highlightEntity(event.getEntityUuid());
  } else if (event.isHoverExit()) {
    removeHighlight(event.getEntityUuid());
  }
});
```

## Camera Integration

When you call `player.camera.enableCustomCamera()`, `CursorService` switches to camera-driven raycasts rather than player-head origin. 

```ts
player.camera.enableCustomCamera();
player.cursor.projectOntoBlock(true);
player.cursor.setVisible(true);
```

## Sharing Cursor Data

Use `cursor.setVisibleToAll()` so other players see the pointer or `hideFrom` to limit it to a certain range of players. Additional helper packets broadcast cursor positions when `isGloballyVisible()` is true, so there’s virtually no extra scripting required to mirror the pointer.

