# Scene Format

Scenes are JSON files with the `.moud.scene` extension. This page is the complete format specification.

## Top-Level Structure

```json
{
  "format": 1,
  "sceneId": "main",
  "displayName": "Main Level",
  "nodes": [ ... ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `format` | int | Yes | Always `1` |
| `sceneId` | string | Yes | Unique ID used by `api.loadScene()` |
| `displayName` | string | Yes | Human-readable name for the editor |
| `nodes` | array | Yes | Array of node objects |

## Node Object

```json
{
  "id": 5,
  "parent": 0,
  "name": "MyNode",
  "type": "Node3D",
  "properties": {
    "x": "10",
    "y": "0",
    "visible": "true"
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | int | Yes | Unique numeric ID within this scene |
| `parent` | int | Yes | Parent node ID, or `0` for root-level |
| `name` | string | Yes | Human-readable name |
| `type` | string | Yes | Node type (see [Node Types](/5_Project_Reference/03_Core_Nodes)) |
| `properties` | object | Yes | String key-value pairs |

## Important Rules

1. **All property values are strings** - even numbers and booleans: `"x": "10.5"`, `"visible": "true"`
2. **Node IDs must be unique** within a scene
3. **Parent `0`** means the node is at the root of the scene tree
4. **Ordering matters** - nodes should be listed such that a parent appears before its children (though the engine is tolerant of ordering)

## Property Types

Although all values are stored as strings, they have logical types:

| Type | Format | Examples |
|---|---|---|
| STRING | Any text | `"Hello"`, `"res://textures/a.png"` |
| INT | Integer as string | `"1"`, `"42"`, `"-5"` |
| FLOAT | Decimal as string | `"10.5"`, `"0.75"`, `"-3.14"` |
| BOOL | `"true"` or `"false"` | `"true"`, `"false"` |

## Minimal Scene Example

The smallest useful scene:

```json
{
  "format": 1,
  "sceneId": "minimal",
  "displayName": "Minimal",
  "nodes": [
    {
      "id": 1,
      "parent": 0,
      "name": "Spawn",
      "type": "PlayerStart",
      "properties": {
        "x": "0",
        "y": "5",
        "z": "0"
      }
    }
  ]
}
```
