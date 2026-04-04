# Node and Properties API

These methods let you read and write node properties, navigate the scene tree, and create or destroy nodes at runtime.

## Node Identity

### `api.id()` → long

Returns the numeric ID of the node this script is attached to.

```js
var myId = api.id();
api.log("My node ID is " + myId);
```

### `api.name()` → string

Returns the name of this node.

### `api.type()` → string

Returns the type ID of this node (e.g. `"Node3D"`, `"RigidBody3D"`, `"Label"`).

## Reading Properties

### `api.get(key)` → string

Returns the value of a property on this node, or `null`/`nil` if not set.

```js
var texture = api.get("texture");
```

### `api.get(nodeId, key)` → string

Returns the value of a property on another node.

```js
var otherName = api.get(otherNodeId, "name");
```

### `api.getNumber(key, fallback)` → double

Parses a property as a number. Returns `fallback` if the property doesn't exist or can't be parsed.

```js
var x = api.getNumber("x", 0);
var health = api.getNumber("health", 100);
```

### `api.getNumber(nodeId, key, fallback)` → double

Same as above but for another node.

```js
var otherY = api.getNumber(otherNodeId, "y", 0);
```

### `api.getString(key, fallback)` → string

Returns the property value, or `fallback` if not set.

```js
var label = api.getString("text", "Default");
```

### `api.getString(nodeId, key, fallback)` → string

Same as above but for another node.

## Writing Properties

### `api.set(key, value)` → void

Sets a property on this node. Both key and value are strings.

```js
api.set("visible", "true");
api.set("text", "Hello World");
api.set("color_tint_r", "0.5");
```

### `api.set(nodeId, key, value)` → void

Sets a property on another node.

```js
api.set(labelId, "text", "Score: " + score);
```

### `api.setNumber(key, value)` → void

Sets a numeric property. Automatically converts the number to a trimmed string.

```js
api.setNumber("x", 10.5);
api.setNumber("health", currentHealth);
```

### `api.setNumber(nodeId, key, value)` → void

Same as above but for another node.

```js
api.setNumber(barId, "value", 75);
```

### `api.remove(key)` → void

Removes a property from this node.

### `api.remove(nodeId, key)` → void

Removes a property from another node.

## Navigating the Tree

### `api.find(path)` → long

Finds a node by name path from this node. Returns the node ID, or 0 if not found.

```js
var sun = api.find("Sun");
var nestedNode = api.find("Parent/Child/GrandChild");
```

### `api.getRootId()` → long

Returns the root node ID of the scene.

### `api.findNodesByType(type)` → long[]

Returns an array of all node IDs matching the given type.

```js
var cameras = api.findNodesByType("Camera3D");
var lights = api.findNodesByType("OmniLight3D");
var areas = api.findNodesByType("Area3D");
```

### `api.getChildren(nodeId)` → long[]

Returns an array of all child node IDs.

```js
var children = api.getChildren(api.id());
for (var i = 0; i < children.length; i++) {
  api.log("Child: " + children[i]);
}
```

### `api.exists(nodeId)` → boolean

Returns `true` if the node exists in the scene tree.

```js
if (api.exists(targetId)) {
  api.set(targetId, "visible", "true");
}
```

## Creating and Destroying Nodes

### `api.createRuntime(parentId, name, typeId)` → long

Creates a new node at runtime. Returns the new node's ID, or 0 on failure.

````tabs
--- tab: JavaScript
```js
// Create a RigidBody3D under the root
var cube = api.createRuntime(0, "MyCube", "RigidBody3D");
if (cube > 0) {
  api.set(cube, "x", "10");
  api.set(cube, "y", "20");
  api.set(cube, "shape", "box");
  api.set(cube, "mass", "2");
  api.set(cube, "sx", "1");
  api.set(cube, "sy", "1");
  api.set(cube, "sz", "1");
}

// Create a Label under a CanvasLayer
var label = api.createRuntime(hudLayerId, "DamageText", "Label");
api.set(label, "text", "-25 HP");
api.set(label, "x", "100");
api.set(label, "y", "50");
```

--- tab: Luau
```lua
local cube = api.createRuntime(0, "MyCube", "RigidBody3D")
if cube > 0 then
    api.set(cube, "x", "10")
    api.set(cube, "y", "20")
    api.set(cube, "shape", "box")
    api.set(cube, "mass", "2")
end
```
````

### `api.free(nodeId)` → void

Queues a node for deletion. It will be removed from the scene tree at the end of the current tick.

```js
api.free(cubeId);
```

### `api.rename(name)` → void / `api.rename(nodeId, name)` → void

Renames this node or another node.

### `api.reparent(nodeId, newParentId)` → void

Moves a node to a new parent in the tree.

```js
api.reparent(childId, newParentId);
```

## Flushing Operations

### `api.flush()` → void

Forces all pending scene operations to be applied immediately. Normally operations are batched and applied at the end of the tick. Call `flush()` if you need a property change to take effect before the next operation.

```js
api.set("x", "10");
api.flush();  // x=10 is now applied
var x = api.getNumber("x", 0);  // returns 10
```
