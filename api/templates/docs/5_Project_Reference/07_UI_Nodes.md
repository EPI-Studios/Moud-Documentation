# UI Nodes

Nodes that make up the 2D user interface: text, buttons, sliders, progress bars, and layout containers.

All UI nodes share these properties:

| Property | Type | Description |
|---|---|---|
| `x`, `y` | float | Position |
| `w`, `h` | float | Width and height |
| `visible` | bool | Show or hide |
| `modulate_r/g/b/a` | float | Color tint |
| `rz` | float | Rotation |
| `sx`, `sy` | float | Scale |
| `anchor_left/right/top/bottom` | float | Anchor point (0 = start, 1 = end of parent) |
| `margin_left/right/top/bottom` | float | Offset from anchor |

## CanvasLayer

The root container for UI. Set `layer` to control draw order (higher layers draw on top of lower ones). Put all your UI nodes as children of a `CanvasLayer`.

## Control and CanvasItem

Base UI types. You usually don't use these directly.

## Label

Displays text.

| Property | Type | Description |
|---|---|---|
| `text` | string | What to show |
| `font_size` | int | Size in pixels |
| `color_r/g/b/a` | float | Text color |
| `h_align` | string | `left`, `center`, or `right` |
| `v_align` | string | `top`, `center`, or `bottom` |
| `autowrap` | bool | Wrap long text to the next line |

## RichTextLabel

Like `Label` but supports BBCode formatting.

| Property | Type | Description |
|---|---|---|
| `text` | string | BBCode text like `[b]bold[/b] [color=ff0000]red[/color]` |
| `bbcode_enabled` | bool | Turn on BBCode parsing |
| `fit_content` | bool | Shrink the element to fit the text |

## Button

A clickable button. Fires the `pressed` signal when clicked.

| Property | Type | Description |
|---|---|---|
| `text` | string | Button label |
| `disabled` | bool | Grey it out and ignore clicks |
| `toggle_mode` | bool | Act as a toggle instead of a momentary press |
| `pressed` | bool | Current state if toggle mode is on |
| `icon` | string | Icon texture path |

## TextureButton

Same as `Button` but displays an image instead of text. Also fires `pressed`.

## CheckBox

A toggle. Fires the `toggled` signal when the state changes.

## HSlider and VSlider

Horizontal and vertical sliders. Fire the `value_changed` signal when the user drags them.

| Property | Type | Description |
|---|---|---|
| `value` | float | Current value |
| `min_value` | float | Left/bottom end |
| `max_value` | float | Right/top end |
| `step` | float | Snap increment |

## ProgressBar

A fill bar for health, loading, experience, etc.

| Property | Type | Description |
|---|---|---|
| `value` | float | Current fill level |
| `min_value` | float | Empty value |
| `max_value` | float | Full value |
| `show_percentage` | bool | Show a percentage number on top |
| `fill_color_r/g/b/a` | float | Bar color |

## LineEdit

A single-line text input field.

## TextureRect

Displays an image.

## ColorRect

A solid color rectangle. Useful for backgrounds and dividers.

## Layout Containers

These arrange their children automatically:

- **HBoxContainer** lays children out left to right
- **VBoxContainer** lays children out top to bottom
- **GridContainer** lays children in a grid
- **MarginContainer** adds padding around its child
- **PanelContainer** puts a panel background behind its children
- **ScrollContainer** makes its content scrollable

| Property | Type | Description |
|---|---|---|
| `separation` | int | Gap between children (HBox and VBox) |
