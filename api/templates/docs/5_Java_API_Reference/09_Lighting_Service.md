# Lighting Service 

Server-side lighting API for creating and managing lights. Exposed via `PluginContext.lighting()` and used by `WorldDsl.light()`.

## Method Summary
| Method | Signature | Description |
| --- | --- | --- |
| `create` | `LightHandle create(PointLightDefinition definition)` | Create a light from a definition and return a handle. |
| `get` | `Optional<LightHandle> get(long id)` | Fetch an existing light handle by id. |
| `all` | `Collection<LightHandle> all()` | List all known lights created through this service. |

### PointLightDefinition (builder)
| Method | Signature | Description |
| --- | --- | --- |
| `type` | `Builder type(String type)` | Set light type (default `point`). |
| `position` | `Builder position(Vector3 position)` | Set light position. |
| `direction` | `Builder direction(Vector3 direction)` | Set light direction (for future light types). |
| `color` | `Builder color(float r, float g, float b)` | Set RGB color. |
| `brightness` | `Builder brightness(float brightness)` | Set intensity multiplier. |
| `radius` | `Builder radius(float radius)` | Set influence radius. |
| `build` | `PointLightDefinition build()` | Build the definition. |

### LightHandle
| Method | Signature | Description |
| --- | --- | --- |
| `id` | `long id()` | Light identifier. |
| `definition` | `PointLightDefinition definition()` | Current definition. |
| `update` | `void update(PointLightDefinition definition)` | Update light properties. |
| `remove` | `void remove()` | Remove the light. |

## Detailed Member Docs

### create
- **Signature**: `LightHandle create(PointLightDefinition definition)`
- **Parameters**: `definition` - light properties (type/position/color/brightness/radius).
- **Returns**: `LightHandle`
- **Description**: Instantiates a light in the world. Returned handle controls updates/removal; implements `AutoCloseable`.

### get
- **Signature**: `Optional<LightHandle> get(long id)`
- **Parameters**: `id` - light id.
- **Returns**: `Optional<LightHandle>`
- **Description**: Retrieves a handle if the light exists.

### all
- **Signature**: `Collection<LightHandle> all()`
- **Parameters**: None.
- **Returns**: Collection of all light handles.
- **Description**: Enumerates lights created via the service.

### PointLightDefinition builder
- **Signature**: `PointLightDefinition.builder()...build()`
- **Parameters**: Configure type/position/direction/color/brightness/radius.
- **Returns**: `PointLightDefinition`
- **Description**: Builder to create light definitions with sane defaults (type=`point`, position=`(0,64,0)`, brightness>0, radius>0).

### LightHandle.update / remove
- **Signature**: `void update(PointLightDefinition definition)`, `void remove()`
- **Parameters**: Updated definition or none.
- **Returns**: `void`
- **Description**: Apply property changes or delete the light. `close()` delegates to `remove()`.

## Code Example
```java
public final class LightingExample extends Plugin {
    private LightHandle light;

    @Override
    public void onEnable(PluginContext context) {
        light = context.lighting().create(
                PointLightDefinition.builder()
                        .position(new Vector3(0, 73, 0))
                        .color(1.0f, 0.8f, 0.6f)
                        .radius(20f)
                        .brightness(2.0f)
                        .build()
        );

        // dim the light every 5 seconds
        schedule().every(5).seconds(() -> {
            PointLightDefinition def = new PointLightDefinition(
                    "point",
                    light.definition().position(),
                    light.definition().direction(),
                    0.6f, 0.7f, 1.0f,
                    1.5f,
                    16f
            );
            light.update(def);
        });
    }

    @Override
    public void onDisable() {
        if (light != null) light.remove();
    }
}
```
