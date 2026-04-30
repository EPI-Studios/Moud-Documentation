# UI System

Moud's UI system works the same way as the rest of the engine: you add nodes to your scene, set properties, and react to signals. The only difference is that UI nodes render as 2D overlays on top of the 3D world instead of being positioned in 3D space.

## How UI Works

UI nodes live under a `CanvasLayer` node. The `CanvasLayer` defines a rendering layer (higher layers draw on top), and its children are the actual UI elements - labels, buttons, progress bars, containers.

```text
CanvasLayer (layer: 1)
├── HealthBar (ProgressBar)
├── ScoreLabel (Label)
├── InfoPanel (PanelContainer)
│   └── InfoBox (VBoxContainer)
│       ├── TitleLabel (Label)
│       ├── StatusLabel (RichTextLabel)
│       └── SpawnButton (Button)
└── VolumeSlider (HSlider)
```

UI events (button presses, slider changes) fire as signals on the server, so your scripts can respond to them.

## Available UI Nodes

### Display

| Node | Purpose |
|---|---|
| `Label` | Plain text |
| `RichTextLabel` | Text with BBCode: `[b]bold[/b]`, `[color=ff0000]red[/color]` |
| `TextureRect` | Displays an image |
| `ColorRect` | Solid color rectangle |
| `ProgressBar` | Horizontal fill bar |

### Input

| Node | Purpose | Signal |
|---|---|---|
| `Button` | Clickable button | `pressed` |
| `TextureButton` | Button with an image | `pressed` |
| `CheckBox` | Toggle on/off | `toggled` |
| `HSlider` | Horizontal slider | `value_changed` |
| `VSlider` | Vertical slider | `value_changed` |
| `LineEdit` | Single-line text field | - |

### Layout

| Node | Purpose |
|---|---|
| `CanvasLayer` | Root UI layer (set `layer` for draw order) |
| `Control` | Base UI control |
| `HBoxContainer` | Lays children out left-to-right |
| `VBoxContainer` | Lays children out top-to-bottom |
| `GridContainer` | Lays children in a grid |
| `MarginContainer` | Adds padding around its child |
| `PanelContainer` | Container with a panel background |
| `ScrollContainer` | Scrollable content area |

## Positioning

UI nodes use an anchor + margin system. **Anchors decide which point of the parent each edge tracks; margins are the pixel offset from that anchor.** Both pieces are needed to position a UI element.

### How anchors work

Each UI node has four anchor floats: `anchor_left`, `anchor_right`, `anchor_top`, `anchor_bottom`. They are all in the range `0.0` to `1.0`, where:

- `0.0` means "this edge is anchored to the parent's left/top edge".
- `1.0` means "this edge is anchored to the parent's right/bottom edge".
- `0.5` means "this edge is anchored to the parent's horizontal/vertical center".

If the parent resizes, the anchor edge moves with it. So a button with `anchor_left = 1` and `anchor_right = 1` always sticks to the parent's right edge regardless of window size.

### How margins work

Each UI node also has four margins: `margin_left`, `margin_right`, `margin_top`, `margin_bottom`. **Each margin is a pixel offset from the anchor that edge points to.** The sign convention follows the anchor:

- `margin_left = 8` with `anchor_left = 0` puts the left edge 8 px to the right of the parent's left edge.
- `margin_left = -180` with `anchor_left = 1` puts the left edge 180 px to the left of the parent's right edge.
- `margin_right` and `margin_bottom` follow the same logic against their anchors.

### Common patterns

```text
+-------------------- parent ---------------------+
|                                                 |
|   anchor_*=0          anchor_top=0,             |
|   margin_*=8          anchor_bottom=0,          |
|   (top-left,          margin_top=8              |
|   fixed offset)       margin_left=8,            |
|                       w=172, h=80               |
|                                                 |
|                                                 |
|             anchor_left=0.5,                    |
|             anchor_right=0.5,                   |
|             margin_left=-100, margin_right=100  |
|             (200px wide, centered horizontally) |
|                                                 |
|                              anchor_left=1,     |
|                              anchor_right=1,    |
|                              margin_left=-180,  |
|                              margin_right=-8,   |
|                              margin_top=8       |
|                              (top-right corner) |
|                                                 |
| anchor_top=1,                                   |
| margin_top=-44,                                 |
| margin_left=8                                   |
| (bottom-left)                                   |
+-------------------------------------------------+
```

Quick rule of thumb:
- Sticking to a fixed corner, want the size constant: anchor both the left/right edges (or both top/bottom) to the same side, and use `w` / `h` plus margins for the offset.
- Want the element to stretch with the parent: anchor opposing edges to opposing parent sides (`anchor_left = 0`, `anchor_right = 1`) and use positive margins to inset.
- Centered in the parent: anchor all edges to `0.5` and use symmetric negative/positive margins.

### Property reference

| Property | Type | Description |
|---|---|---|
| `x`, `y` | float | Position offset (absolute, takes precedence over anchors when no margins are set). |
| `w`, `h` | float | Width and height in pixels. Used when only one edge is anchored. |
| `anchor_left/right/top/bottom` | float | Anchor points, `0` = parent start edge, `1` = parent end edge. |
| `margin_left/right/top/bottom` | float | Pixel offset from the corresponding anchor edge. Negative pulls inward when the anchor is at `1`. |

### Example: Top-Right Corner Panel

```json
{
  "type": "PanelContainer",
  "properties": {
    "anchor_left": "1",
    "anchor_right": "1",
    "margin_left": "-180",
    "margin_right": "-8",
    "margin_top": "8",
    "w": "172",
    "h": "80"
  }
}
```

Both horizontal anchors are at the parent's right edge. `margin_left = -180` puts the panel's left edge 180 px to the left of that anchor, and `margin_right = -8` puts the panel's right edge 8 px to the left, giving a 172 px wide panel sitting in the top-right corner with an 8 px gutter.

### Example: Bottom-Left Label

```json
{
  "type": "Label",
  "properties": {
    "anchor_top": "1",
    "margin_top": "-44",
    "margin_left": "8",
    "text": "Volume",
    "font_size": "16"
  }
}
```

`anchor_top = 1` pins the top edge to the parent's bottom edge; `margin_top = -44` lifts it back up 44 px. `margin_left = 8` provides an 8 px left gutter.

---

## Building UI from script

UI is just regular nodes, so anything you can author in `.moud.scene` JSON you can also build at runtime through the script API. The same `api:set` / `api:setNumber` calls apply, and `api:createRuntime(parentId, nodeName, typeId)` spawns a new node of the requested type.

````tabs
--- tab: Luau
```lua
local script = {}

function script:_ready(api)
    local hud = api:createRuntime(api:id(), "HUD", "Control")
    api:set(hud, "anchor_right", "1")
    api:set(hud, "anchor_bottom", "1")

    local healthBar = api:createRuntime(hud, "HealthBar", "ProgressBar")
    api:set(healthBar, "anchor_left", "0")
    api:set(healthBar, "anchor_top", "0")
    api:set(healthBar, "margin_left", "16")
    api:set(healthBar, "margin_top", "16")
    api:set(healthBar, "w", "200")
    api:set(healthBar, "h", "12")
    api:setNumber(healthBar, "min_value", 0)
    api:setNumber(healthBar, "max_value", 100)
    api:setNumber(healthBar, "value", 75)

    local startBtn = api:createRuntime(hud, "StartButton", "Button")
    api:set(startBtn, "anchor_left", "0.5")
    api:set(startBtn, "anchor_right", "0.5")
    api:set(startBtn, "anchor_top", "1")
    api:set(startBtn, "margin_left", "-80")
    api:set(startBtn, "margin_right", "80")
    api:set(startBtn, "margin_top", "-64")
    api:set(startBtn, "h", "48")
    api:set(startBtn, "text", "Start")
    api:connect(startBtn, "pressed", api:id(), "_on_start")

    api:flush()
end

function script:_on_start(api)
    api:log("start pressed")
end

return script
```

--- tab: JavaScript
```js
({
  _ready(api) {
    var hud = api.createRuntime(api.id(), "HUD", "Control");
    api.set(hud, "anchor_right", "1");
    api.set(hud, "anchor_bottom", "1");

    var bar = api.createRuntime(hud, "HealthBar", "ProgressBar");
    api.set(bar, "margin_left", "16");
    api.set(bar, "margin_top", "16");
    api.set(bar, "w", "200");
    api.set(bar, "h", "12");
    api.setNumber(bar, "max_value", 100);
    api.setNumber(bar, "value", 75);
  }
})
```

--- tab: TypeScript
```typescript
import { Control, ProgressBar, Button, Node3D, ready, signal } from "moud";

export default class HudBuilder extends Node3D {
  @ready()
  init() {
    const hud = this.createChild<Control>("HUD", "Control");
    hud.anchorRight = 1;
    hud.anchorBottom = 1;

    const bar = hud.createChild<ProgressBar>("HealthBar", "ProgressBar");
    bar.marginLeft = 16;
    bar.marginTop = 16;
    bar.w = 200;
    bar.h = 12;
    bar.maxValue = 100;
    bar.value = 75;

    const start = hud.createChild<Button>("StartButton", "Button");
    start.anchorLeft = 0.5;
    start.anchorRight = 0.5;
    start.anchorTop = 1;
    start.marginLeft = -80;
    start.marginRight = 80;
    start.marginTop = -64;
    start.h = 48;
    start.text = "Start";
    start.connect({ signal: "pressed", target: this, handler: this.onStart });
  }

  @signal("pressed")
  onStart() { console.log("start pressed"); }
}
```
````

`api:createRuntime` returns the new node's id. The new node only exists in the live scene; it is not written back to the source `.moud.scene` file. Call `api:flush()` if you need the node to be visible to subsequent calls in the same tick.

## Styling Properties

All UI nodes support:

| Property | Type | Description |
|---|---|---|
| `visible` | bool | Show/hide |
| `modulate_r/g/b/a` | float | Color multiplier (tint the whole element) |
| `rz` | float | Rotation in degrees |
| `sx`, `sy` | float | Scale |

### Label Properties

| Property | Type | Description |
|---|---|---|
| `text` | string | The displayed text |
| `font_size` | int | Font size in pixels |
| `color_r/g/b/a` | float | Text color |
| `h_align` | string | `"left"`, `"center"`, `"right"` |
| `v_align` | string | `"top"`, `"center"`, `"bottom"` |
| `autowrap` | bool | Wrap long text |

### RichTextLabel Properties

| Property | Type | Description |
|---|---|---|
| `text` | string | BBCode text (e.g. `[b]Status:[/b] [color=88ff88]Active[/color]`) |
| `bbcode_enabled` | bool | Enable BBCode parsing |
| `fit_content` | bool | Shrink to fit content |

### ProgressBar Properties

| Property | Type | Description |
|---|---|---|
| `value` | float | Current value |
| `min_value` | float | Minimum value |
| `max_value` | float | Maximum value |
| `show_percentage` | bool | Display percentage text |
| `fill_color_r/g/b/a` | float | Bar fill color |

### Slider Properties (HSlider / VSlider)

| Property | Type | Description |
|---|---|---|
| `value` | float | Current value |
| `min_value` | float | Minimum |
| `max_value` | float | Maximum |
| `step` | float | Step increment |

### Button Properties

| Property | Type | Description |
|---|---|---|
| `text` | string | Button label |
| `disabled` | bool | Grey out and ignore clicks |
| `toggle_mode` | bool | Act as a toggle instead of momentary |
| `pressed` | bool | Current toggle state |
| `icon` | string | Icon texture path |

### Container Properties

`HBoxContainer` and `VBoxContainer` use a single axis with a uniform gap:

| Property | Type | Description |
|---|---|---|
| `separation` | int | Pixel gap between successive children. Applies to `HBoxContainer` and `VBoxContainer`. |

`GridContainer` lays children out in fixed-column rows:

| Property | Type | Description |
|---|---|---|
| `columns` | int | Number of columns. Children fill rows left to right; a new row starts after every `columns` items. Required for the grid to lay out at all. |
| `h_separation` | int | Pixel gap between columns. |
| `v_separation` | int | Pixel gap between rows. |

`MarginContainer` applies inset padding around its single child:

| Property | Type | Description |
|---|---|---|
| `margin_left`, `margin_right`, `margin_top`, `margin_bottom` | int | Per-edge padding in pixels (separate from the anchor margins on the container itself). |

`PanelContainer` and `ScrollContainer` size and clip their child to their own rect; they do not introduce additional layout properties beyond the standard anchor/margin set.

## Handling UI Events

Connect to UI signals just like any other signal:

````tabs
--- tab: JavaScript
```js
({
  _enter_tree(api) {
    this.api = api;
    var btn = api.find("SpawnButton");
    var slider = api.find("VolumeSlider");
    api.connect(btn, "pressed", api.id(), "_on_spawn_pressed");
    api.connect(slider, "value_changed", api.id(), "_on_volume_changed");
  },

  _on_spawn_pressed() {
    this.api.log("Spawn button clicked!");
  },

  _on_volume_changed(value) {
    this.api.log("Volume: " + value);
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_enter_tree(api)
    self.api = api
    local btn = api.find("SpawnButton")
    local slider = api.find("VolumeSlider")
    api.connect(btn, "pressed", api.id(), "_on_spawn_pressed")
    api.connect(slider, "value_changed", api.id(), "_on_volume_changed")
end

function script:_on_spawn_pressed()
    self.api:log("Spawn button clicked!")
end

function script:_on_volume_changed(value)
    self.api:log("Volume: " .. tostring(value))
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class UiEvents extends NodeScript {
    @Override public void onEnterTree() {
        long btn = core.find("SpawnButton");
        long slider = core.find("VolumeSlider");
        core.connect(btn, "pressed", core.id(), "_on_spawn_pressed");
        core.connect(slider, "value_changed", core.id(), "_on_volume_changed");
    }

    public void onSpawnPressed() {
        core.log("Spawn button clicked!");
    }

    public void onVolumeChanged(Object value) {
        core.log("Volume: " + value);
    }
}
```
````

## Updating UI from Scripts

Since UI properties are just node properties, update them with `api.set()`:

````tabs
--- tab: JavaScript
```js
// Update a label
api.set(scoreLabel, "text", "Score: " + score);

// Update a progress bar
api.setNumber(healthBar, "value", currentHealth);

// Hide an element
api.set(panel, "visible", "false");

// Change text color to red
api.set(label, "color_r", "1");
api.set(label, "color_g", "0");
api.set(label, "color_b", "0");
```

--- tab: Luau
```lua
api.set(scoreLabel, "text", "Score: " .. tostring(score))
api.setNumber(healthBar, "value", currentHealth)
api.set(panel, "visible", "false")
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class UiUpdates extends NodeScript {
    @Override public void onProcess(double dt) {
        // Update a label
        core.set(scoreLabel, "text", "Score: " + score);

        // Update a progress bar
        core.setNumber(healthBar, "value", currentHealth);

        // Hide an element
        core.set(panel, "visible", "false");

        // Change text color to red
        core.set(label, "color_r", "1");
        core.set(label, "color_g", "0");
        core.set(label, "color_b", "0");
    }
}
```
````

