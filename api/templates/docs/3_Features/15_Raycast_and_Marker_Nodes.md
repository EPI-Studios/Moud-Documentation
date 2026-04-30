# Raycast3D and Marker3D

Two utility nodes appear in the editor's Physics and Markers categories that the existing nodes documentation does not yet cover. Both run inside the server scene tick.

---

## `Raycast3D`

Casts a ray every physics step from its world position toward a target offset, and writes the result back onto its own properties so scripts and signals can react.

| Property | Type | Default | Description |
|---|---|---|---|
| `target_x`, `target_y`, `target_z` | float | `0, -1, 0` | Direction and length of the ray, in node-local space. The default casts one unit straight down. |
| `max_distance` | float | `100` | Hard cap on the ray length, regardless of the target vector magnitude. |
| `enabled` | bool | `true` | When false the ray is skipped, and the result properties are not updated. |
| `collision_layer` | int | `1` | The ray's own layer bitmask (typically not used for filtering, kept for symmetry with bodies). |
| `collision_mask` | int | `1` | Bitmask of layers the ray will collide with. Set this to match the bodies you want to detect. |
| `script` | string | `null` | Optional script attached to the node. |

After every physics tick the simulator writes the following result properties on the same node:

| Property | Type | Description |
|---|---|---|
| `is_colliding` | bool | `true` if the ray hit something this step. |
| `hit_x`, `hit_y`, `hit_z` | float | World-space hit position. Zero when no hit. |
| `hit_node_id` | int | Node id of the hit body, or `0` when no hit. |

Read these from a script the same way you read any other property:

```lua
local script = {}

function script:_physics_process(api, dt)
    if api:node():getBool(api:id(), "is_colliding") then
        local hitId = api:node():getInt(api:id(), "hit_node_id", 0)
        api:log("ground at node " .. hitId)
    end
end

return script
```

`Raycast3D` is the cheapest way to set up "is the player on the ground", "is there a wall in front", or "what node is the laser pointing at" without authoring a one-shot raycast in script every tick.

---

## `Marker3D`

A pure transform node, useful as a named anchor point. It has no runtime behavior beyond holding its position and rotation; the editor renders a small gizmo at its location whose size is controlled by `gizmo_size`.

| Property | Type | Default | Description |
|---|---|---|---|
| `gizmo_size` | float | `0.5` | Scale of the editor-only debug gizmo. Has no runtime effect. |
| `script` | string | `null` | Optional script attached to the node. |

Common uses:

- Spawn points (look up by node name from script).
- Camera focus targets.
- Designer-placed reference points for procedural systems.

Because the node has no body and no behaviour, it is essentially free at runtime.
