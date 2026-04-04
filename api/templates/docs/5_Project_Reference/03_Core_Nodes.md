# Core Nodes

These are the base node types that most other nodes build on.

## Node

The simplest node. No special behavior, no properties. You almost never use this directly.

## Node3D

The base for anything that exists in 3D space. Every 3D node inherits these properties.

| Property | Type | Default | Description |
|---|---|---|---|
| `x`, `y`, `z` | float | 0 | Position |
| `rx`, `ry`, `rz` | float | 0 | Rotation in degrees |
| `sx`, `sy`, `sz` | float | 1 | Scale |
| `visible` | bool | true | Whether the node is rendered |
| `script` | string | | Script file path |

If you need a container to hold a script or group child nodes, use `Node3D`.

## Node2D

Same idea as `Node3D` but for 2D. Used as a base for UI elements.

| Property | Type | Default | Description |
|---|---|---|---|
| `x`, `y` | float | 0 | Position |
| `rz` | float | 0 | Rotation in degrees |
| `sx`, `sy` | float | 1 | Scale |

## PlayerStart

Tells the server where to put players when they join. Drop one of these in your scene and players will spawn at that position.

| Property | Type | Description |
|---|---|---|
| `x`, `y`, `z` | float | Spawn position |
| `ry` | float | Which direction the player faces (yaw) |

## SceneInstance3D

Embeds another `.moud.scene` file as a subtree inside this scene. Useful for reusable pieces like decorations or prefabs.

| Property | Type | Description |
|---|---|---|
| `scene_id` | string | Path to the scene file (`res://...`) |
| `x`, `y`, `z` | float | Offset position |
| `rx`, `ry`, `rz` | float | Offset rotation |

## Ticker

A utility node that counts up every tick. The `ticks` property increments automatically.

| Property | Type | Description |
|---|---|---|
| `ticks` | int | Current tick count |

## PlayerBody

Represents a connected player's physical body in the scene. You don't create these yourself, the server manages them.

## Marker3D

An invisible point in 3D space. Handy for marking spawn points, waypoints, or reference positions that scripts can look up with `api.find()`.
