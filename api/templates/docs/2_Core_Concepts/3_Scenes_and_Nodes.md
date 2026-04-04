# Scenes and Nodes

Everything in a Moud game is built from **scenes** and **nodes**. The concept is simple and this page walks through all of it.

## What Is a Scene?

A scene is a JSON file (`.moud.scene`) that describes a tree of nodes. It represents a level, a room, a HUD, a menu - whatever you want. A project can have many scenes.

```json
{
  "format": 1,
  "sceneId": "main",
  "displayName": "Main Level",
  "nodes": [ ... ]
}
```

- `format` - always `1` for now
- `sceneId` - the ID used by `api.loadScene("main")` to switch scenes
- `displayName` - human-readable name shown in the editor
- `nodes` - the array of nodes in this scene

## What Is a Node?

A node is the fundamental building block. Every object in your game - a floor, a light, a camera, a UI button, a physics body, a script container - is a node.

```json
{
  "id": 5,
  "parent": 0,
  "name": "MyBox",
  "type": "CSGBox",
  "properties": {
    "x": "10",
    "y": "0",
    "z": "5",
    "sx": "2",
    "sy": "2",
    "sz": "2",
    "solid": "true",
    "texture": "moud:dynamic/white"
  }
}
```

Every node has:

| Field | Type | Description |
|---|---|---|
| `id` | integer | Unique numeric ID within the scene |
| `parent` | integer | ID of the parent node, or `0` for root-level |
| `name` | string | Human-readable name |
| `type` | string | The node type (determines behavior and available properties) |
| `properties` | object | String key-value pairs |

```hint important All property values are strings
Even numeric values like position or scale are stored as strings: `"x": "10.5"`, `"visible": "true"`. The scripting API has convenience methods like `api.getNumber()` and `api.setNumber()` for working with these.
```

## The Node Tree

Nodes form a tree through parent-child relationships. A node with `"parent": 0` sits at the root. A node with `"parent": 5` is a child of the node with `id: 5`.

```text
Root (id: 0, implicit)
├── Floor (id: 1, type: CSGBox)
├── Sun (id: 2, type: DirectionalLight3D)
├── Player (id: 3, type: Node3D)
│   └── Camera (id: 4, type: Camera3D, parent: 3)
└── HUD (id: 5, type: CanvasLayer)
    ├── HealthBar (id: 6, type: ProgressBar, parent: 5)
    └── ScoreLabel (id: 7, type: Label, parent: 5)
```

Child nodes inherit their parent's transform - if you move a parent, all its children move with it.

## Node Types

Moud has A LOT of built-in node types.

For the complete property reference for each node type, see [Node Type Reference](/5_Project_Reference/03_Core_Nodes).

## Common Properties

Most 3D nodes share these properties:

### Transform

| Property | Type | Description |
|---|---|---|
| `x`, `y`, `z` | float | Position in world space |
| `rx`, `ry`, `rz` | float | Rotation in degrees |
| `sx`, `sy`, `sz` | float | Scale |

### Rendering

| Property | Type | Description |
|---|---|---|
| `visible` | bool | Whether the node is rendered |
| `texture` | string | Texture path (`res://...` or `moud:...`) |
| `material` | string | Material path (`res://materials/...`) |
| `opacity` | float | Transparency (0 = invisible, 1 = solid) |
| `color_tint_r/g/b` | float | Color tint (0–1 per channel) |
| `mesh` | string | Mesh type: `cube`, `sphere`, `plane`, `cross`, or model path |
| `billboard` | bool | Always face the camera |
| `double_sided` | bool | Render both sides of faces |

### Physics

| Property | Type | Description |
|---|---|---|
| `solid` | bool | Has collision |
| `shape` | string | Collision shape: `box`, `sphere`, `capsule` |
| `collision_layer` | int | Which layer this body is on |
| `collision_mask` | int | Which layers this body collides with |
| `mass` | float | Mass for `RigidBody3D` |
| `gravity_scale` | float | Gravity multiplier |
| `freeze` | bool | Freeze a `RigidBody3D` in place |

### Script

| Property | Type | Description |
|---|---|---|
| `script` | string | Path to a `.js` or `.luau` script file |

## Creating Nodes at Runtime

Scripts can create new nodes on the fly with `api.createRuntime()`:

````tabs
--- tab: JavaScript
```js
var cube = api.createRuntime(0, "FallingCube", "RigidBody3D");
api.set(cube, "x", "10");
api.set(cube, "y", "20");
api.set(cube, "shape", "box");
api.set(cube, "mass", "2");
api.set(cube, "sx", "1");
api.set(cube, "sy", "1");
api.set(cube, "sz", "1");
```

--- tab: Luau
```lua
local cube = api.createRuntime(0, "FallingCube", "RigidBody3D")
api.set(cube, "x", "10")
api.set(cube, "y", "20")
api.set(cube, "shape", "box")
api.set(cube, "mass", "2")
api.set(cube, "sx", "1")
api.set(cube, "sy", "1")
api.set(cube, "sz", "1")
```
````

And remove them with `api.free(nodeId)`.

## Navigating the Tree from Scripts

| Method | Returns | Description |
|---|---|---|
| `api.id()` | `long` | This node's ID |
| `api.find("path/to/node")` | `long` | Find a node by path from this node |
| `api.findNodesByType("Camera3D")` | `long[]` | Find all nodes of a type |
| `api.getChildren(nodeId)` | `long[]` | Get a node's children |
| `api.exists(nodeId)` | `boolean` | Check if a node exists |
| `api.getRootId()` | `long` | Get the root node ID |
| `api.instantiate("scenePath", parentId)` | `long` | Instantiate another scene as a subtree |
