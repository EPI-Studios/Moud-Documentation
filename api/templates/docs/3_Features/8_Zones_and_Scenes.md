# Zones and Scene Management

Scenes are how you break your game into levels, rooms, or separate areas. Inside a scene, Area3D nodes work as zones that pick up on players walking in or out. Between the two, you have pretty much everything you need to build multi-level games with triggers, teleporters, and transitions.

## Scenes as Levels

Each `.moud.scene` file represents a self-contained environment. You can switch between scenes at runtime:

````tabs
--- tab: JavaScript
```js
// load a different scene by its sceneId
api.loadScene("dungeon");
```

--- tab: Luau
```lua
api.loadScene("dungeon")
```
````

The `sceneId` comes from the scene file:

```json
{
  "format": 1,
  "sceneId": "dungeon",
  "displayName": "Dark Dungeon",
  "nodes": [ ... ]
}
```

## Embedding Scenes with SceneInstance3D

You can embed one scene inside another using `SceneInstance3D`. This is useful for reusable prefabs or splitting large levels into pieces:

```json
{
  "type": "SceneInstance3D",
  "properties": {
    "scene_id": "res://save.moud.scene",
    "x": "0", "y": "0", "z": "0"
  }
}
```

You can also instantiate scenes from scripts:

```js
var childId = api.instantiate("scenes/decoration.moud.scene", parentNodeId);
```

## Zones with Area3D

An `Area3D` is a trigger volume. It doesn't block movement - it detects when players enter and leave. 

### Setting Up a Zone

```json
{
  "type": "Area3D",
  "properties": {
    "x": "10", "y": "0", "z": "5",
    "shape": "box",
    "sx": "5", "sy": "3", "sz": "5",
    "monitoring": "true",
    "collision_layer": "1",
    "collision_mask": "1",
    "script": "scripts/teleporter.js"
  }
}
```

| Property | Type | Description |
|---|---|---|
| `shape` | string | `"box"` or `"sphere"` |
| `sx/sy/sz` | float | Size of the trigger volume (for box) |
| `radius` | float | Radius (for sphere) |
| `monitoring` | bool | Must be `"true"` to detect overlaps |
| `collision_layer` | int | What layer this zone is on |
| `collision_mask` | int | What layers it detects |

### Zone Signals

| Signal | Argument | When |
|---|---|---|
| `area_entered` | player UUID (string) | A player enters the zone |
| `area_exited` | player UUID (string) | A player leaves the zone |

### Example: Teleporter Zone

````tabs
--- tab: JavaScript
```js
({
  _enter_tree(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_enter");
  },

  _on_enter(playerUuid) {
    this.api.teleportPlayer(playerUuid, 0, 10, 0);
    this.api.log("Teleported " + playerUuid);
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_enter_tree(api)
    self.api = api
    api.connect(api.id(), "area_entered", api.id(), "_on_enter")
end

function script:_on_enter(playerUuid)
    self.api:teleportPlayer(playerUuid, 0, 10, 0)
    self.api:log("Teleported " .. playerUuid)
end

return script
```
````