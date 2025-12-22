# Lighting 

Server-only lighting controls exposed via `api.lighting`.

## Light Management

### createPointLight
```ts
createPointLight(id: number, position: Vector3, color: Vector3, radius: number, brightness: number): void
```
Creates a point light that emits light in all directions from a specific position.

- **Parameters**: 
  - `id`: Unique numeric identifier.
  - `position`: World position `Vector3`.
  - `color`: RGB color `Vector3` (values 0.0 to 1.0).
  - `radius`: Influence radius in blocks.
  - `brightness`: Intensity multiplier.
- **Returns**: `void`.
- **Example**:
```ts
const pos = api.math.vector3(0, 75, 0);
const color = api.math.vector3(1.0, 0.8, 0.6);
api.lighting.createPointLight(1, pos, color, 24.0, 2.0);
```

### createAreaLight
```ts
createAreaLight(id: number, position: Vector3, direction: Vector3, color: Vector3, width: number, height: number, brightness: number): void
```
Creates an area light that emits light from a rectangular plane in a specific direction.

- **Parameters**:
  - `id`: Unique numeric identifier.
  - `position`: Center position `Vector3`.
  - `direction`: Direction `Vector3` the light faces.
  - `color`: RGB color `Vector3` (values 0.0 to 1.0).
  - `width`: Width of the emitter plane.
  - `height`: Height of the emitter plane.
  - `brightness`: Intensity multiplier.
- **Returns**: `void`.
- **Example**:
```ts
api.lighting.createAreaLight(
    2,
    api.math.vector3(10, 70, 10),
    api.math.vector3(0, -1, 0), // Downwards
    api.math.vector3(0.2, 0.7, 1.0),
    6.0, 3.0, 1.5
);
```

### updateLight
```ts
updateLight(id: number, properties: object): void
```
Updates specific properties of an existing light. Only the fields provided in the properties object will be changed.

- **Parameters**:
  - `id`: The numeric identifier of the light to update.
  - `properties`: Object containing fields to update (e.g., `x`, `y`, `z`, `r`, `g`, `b`, `radius`, `brightness`).
- **Returns**: `void`.
- **Example**:
```ts
// Change color to red and dim the brightness
api.lighting.updateLight(1, {
    r: 1.0, g: 0.0, b: 0.0,
    brightness: 0.5
});
```

### removeLight
```ts
removeLight(id: number): void
```
Deletes a managed light by its identifier.

- **Parameters**: 
  - `id`: The numeric identifier of the light.
- **Returns**: `void`.
- **Example**:
```ts
api.lighting.removeLight(1);
```