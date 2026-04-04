# Scene Management API

Load scenes, instantiate subscenes, and manage the scene lifecycle.

## Loading Scenes

### `api.loadScene(sceneId)` → void

Loads a scene by its `sceneId` (defined in the `.moud.scene` file). This replaces the current scene.

```js
api.loadScene("dungeon");
api.loadScene("main_menu");
api.loadScene("level_2");
```

The `sceneId` comes from the scene file:

```json
{
  "format": 1,
  "sceneId": "dungeon",
  "displayName": "Dark Dungeon"
}
```

## Instantiating Subscenes

### `api.instantiate(scenePath, parentId)` → long

Instantiates a scene file as a subtree under the given parent node. Returns the root node ID of the instantiated tree.

```js
// Spawn a decoration scene under the root
var deco = api.instantiate("scenes/tree.moud.scene", 0);

// Spawn a prefab under a specific parent
var enemy = api.instantiate("scenes/enemy.moud.scene", spawnPointId);
```

This is how you create reusable prefabs - author a scene once, instantiate it many times.

## Flushing Operations

### `api.flush()` → void

Forces all pending scene operations to be applied immediately.

Normally, scene operations (property changes, node creation, etc.) are batched and applied at the end of each tick. If you need a change to be visible to subsequent API calls within the same tick, call `flush()`.

```js
var node = api.createRuntime(0, "Test", "Node3D");
api.set(node, "x", "10");
api.flush();
// Now api.getNumber(node, "x", 0) will return 10
```

In most cases you don't need `flush()` - the default batching works fine.
