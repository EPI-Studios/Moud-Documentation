# Physics Controller 

Physics integration for spawned models. Exposed via `PluginContext.physics()` and used by `WorldDsl.ModelBuilder.physics(...)`.

## Method Summary
| Method | Signature | Description |
| --- | --- | --- |
| `supported` | `boolean supported()` | Check if server physics is available. |
| `attachDynamic` | `void attachDynamic(long modelId, PhysicsBodyDefinition definition)` | Attach a dynamic body to a spawned model. |
| `detach` | `void detach(long modelId)` | Remove physics body from a model. |

### PhysicsBodyDefinition
| Method | Signature | Description |
| --- | --- | --- |
| ctor | `new PhysicsBodyDefinition(Vector3 halfExtents, float mass, Vector3 initialVelocity)` | Defines collider size, mass, initial velocity. |

## Detailed Member Docs

### supported
- **Signature**: `boolean supported()`
- **Parameters**: None.
- **Returns**: `boolean`
- **Description**: Indicates whether the physics backend is available/enabled on the server. Check before attaching bodies.

### attachDynamic
- **Signature**: `void attachDynamic(long modelId, PhysicsBodyDefinition definition)`
- **Parameters**:
  - `modelId` - id of the spawned model (from `ModelHandle`).
  - `definition` - collider/mass/velocity definition.
- **Returns**: `void`
- **Description**: Attaches a dynamic rigid body to the given model. Uses safe defaults for missing values (half-extents 0.5, mass > 0, zero velocity).

### detach
- **Signature**: `void detach(long modelId)`
- **Parameters**: `modelId` - id of the model.
- **Returns**: `void`
- **Description**: Removes the physics body from the model.

### PhysicsBodyDefinition
- **Signature**: `new PhysicsBodyDefinition(Vector3 halfExtents, float mass, Vector3 initialVelocity)`
- **Parameters**:
  - `halfExtents` - collider half-size (defaults to 0.5,0.5,0.5 if null).
  - `mass` - body mass (clamped to >0).
  - `initialVelocity` - starting velocity (defaults to zero).
- **Returns**: `PhysicsBodyDefinition`
- **Description**: Immutable record used to configure dynamic bodies. Null or non-positive inputs are sanitized.

## Code Sample
```java
public final class PhysicsExample extends Plugin {
    @Override
    public void onEnable(PluginContext context) {
        if (!context.physics().supported()) {
            context.logger().warn("physics backend not available; skipping collider setup.");
            return;
        }

        GameObject obj = context.world().spawn("moud:models/crate.obj")
                .at(0, 80, 0)
                .build();

        context.physics().attachDynamic(
                obj.id(),
                new PhysicsController.PhysicsBodyDefinition(
                        new Vector3(0.5, 0.5, 0.5),
                        5.0f,
                        new Vector3(0, 0, 0)
                )
        );
    }
}
```
