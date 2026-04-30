# Raycast3D and Marker3D

The engine provides dedicated utility nodes for continuous spatial evaluation and coordinate referencing within the scene tree. These nodes execute on the server during the physics step and scene tick, respectively.

---

## Raycast3D

`Raycast3D` projects a line segment through the physics space during every physics step to detect intersections with physical bodies. Rather than requiring an explicit function call from a script, the node automatically evaluates the ray and writes the collision results back to its own properties. Scripts and signals can then query these properties to determine state.

### Configuration properties

The following properties dictate the geometry and behavior of the raycast.

| Property | Type | Default | Description |
|---|---|---|---|
| `target_x`, `target_y`, `target_z` | float | `0, -1, 0` | The directional vector and length of the ray in local coordinate space. |
| `max_distance` | float | `100` | The absolute maximum evaluation length of the ray. |
| `enabled` | bool | `true` | Determines whether the physics engine evaluates the ray during the current step. If `false`, result properties are not updated. |
| `collision_layer` | int | `1` | The physics layer bitmask assigned to the ray. |
| `collision_mask` | int | `1` | The physics layer bitmask the ray queries against. The ray ignores bodies that do not share a layer with this mask. |

### Result properties

Following each physics tick, the simulator updates the following properties on the node. These should be treated as read-only output by scripts.

| Property | Type | Description |
|---|---|---|
| `is_colliding` | bool | Evaluates to `true` if the ray intersected a valid physics body during the last step. |
| `hit_x`, `hit_y`, `hit_z` | float | The absolute world-space coordinate of the intersection point. Evaluates to `0, 0, 0` if `is_colliding` is `false`. |
| `hit_node_id` | int | The scene graph ID of the intersected node. Evaluates to `0` if `is_colliding` is `false`. |

### Script execution

Scripts can read the result properties of a `Raycast3D` node to execute logic based on continuous environmental factors, such as ground detection or line-of-sight verification.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, physicsProcess } from "moud";

export default class GroundDetector extends Node3D {
  @physicsProcess()
  onPhysicsProcess(dt: number) {
    if (this.getProperty<boolean>("is_colliding")) {
      const hitId = this.getProperty<number>("hit_node_id");
      this.api.log(`Ground detected at node ID: ${hitId}`);
    }
  }
}
```

--- tab: JavaScript
```js
({
  _physics_process(api, dt) {
    if (api.getBool(api.id(), "is_colliding")) {
      const hitId = api.getInt(api.id(), "hit_node_id", 0);
      api.log("Ground detected at node ID: " + hitId);
    }
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_physics_process(api, dt)
  if api:getBool(api:id(), "is_colliding") then
    local hitId = api:getInt(api:id(), "hit_node_id", 0)
    api:log("Ground detected at node ID: " .. tostring(hitId))
  end
end
return script
```
````

---

## Marker3D

`Marker3D` is a spatial node that contains only transform data. It does not evaluate physics, collision, or rendering logic. It is utilized exclusively as a persistent coordinate reference point within the scene graph.

During authoring, the editor renders a geometric gizmo at the node's location to assist with placement.

| Property | Type | Default | Description |
|---|---|---|---|
| `gizmo_size` | float | `0.5` | Evaluates the scale of the editor-only debug gizmo. This property has no effect on the runtime simulation. |

### Implementations

Because `Marker3D` lacks behavioral logic, it incurs negligible computational overhead during the server tick. Common implementations include:
*   Static spawn point coordinates (e.g., `PlayerStart`).
*   Target tracking coordinates for cameras or AI pathfinding.
*   Spatial anchors for instantiating procedural `SceneInstance3D` geometry.