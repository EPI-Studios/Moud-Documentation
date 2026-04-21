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

UI nodes use an anchor + margin system:

| Property | Type | Description |
|---|---|---|
| `x`, `y` | float | Position offset |
| `w`, `h` | float | Width and height |
| `anchor_left/right/top/bottom` | float | Anchor points (0 = start, 1 = end of parent) |
| `margin_left/right/top/bottom` | float | Offset from anchor |

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

Anchors the panel to the right edge (`anchor_left: 1`, `anchor_right: 1`) and uses negative margins to pull it inward.

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

| Property | Type | Description |
|---|---|---|
| `separation` | int | Spacing between children (VBox, HBox) |

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

