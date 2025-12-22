# Math

Math helpers exposed via `api.math` (server) and `MoudMath` utilities. Provides vectors, quaternions, matrices, transforms, and common constants.

## Vector and Rotation Builders

### vector3
```ts
vector3(x?: number, y?: number, z?: number): Vector3
```
Creates a 3D vector; defaults to `(0,0,0)` if you omit components.

- **Parameters**: `x`, `y`, `z` - optional components; fill only what you need.
- **Returns**: `Vector3` instance you can mutate or pass into other math helpers.
- **When to use**: Any time you need a position, direction, or offset in world space.
    
    Avoid constructing inside tight render loops if you can reuse objects; allocations add up.
- **Example**:
```ts
const offset = api.math.vector3(0, 2, 0);
player.teleport(player.getPos().add(offset));
```

### quaternion
```ts
quaternion(x?: number, y?: number, z?: number, w?: number): Quaternion
```
Builds a quaternion from raw components; defaults form the identity rotation.

- **Parameters**: Component values; skip them to get identity.
- **Returns**: `Quaternion`.


Ensure the quaternion is normalized if you combine many rotations; drift can occur.
- **Example**:
```ts
const rot = api.math.quaternion(0, 0.707, 0, 0.707); // ~90° around Y
```

### quaternionFromEuler
```ts
quaternionFromEuler(pitch: number, yaw: number, roll: number): Quaternion
```
Produces a quaternion from Euler degrees, avoiding gimbal lock for chained rotations.

- **Parameters**: `pitch`, `yaw`, `roll` - in degrees.
- **Returns**: `Quaternion`.
- **When to use**: Converting camera-like angles into rotation math.


 Inputs are degrees, not radians; mixing units leads to wild rotations.
- **Example**:
```ts
const facing = api.math.quaternionFromEuler(0, player.getYaw(), 0);
```

## Matrix Constructors

### matrix4
```ts
matrix4(): Matrix4
```
Creates an identity 4x4 matrix; useful as a neutral starting point.

- **Parameters**: None.
- **Returns**: `Matrix4`.
- **When to use**: As a base before applying transforms or for resetting state.


 Mutating the same matrix across frames can accumulate floating error; recreate when needed.
- **Example**:
```ts
const identity = api.math.matrix4();
```

### matrix4Translation / matrix4Rotation / matrix4Scaling / matrix4TRS
```ts
matrix4Translation(translation: Vector3): Matrix4
matrix4Rotation(rotation: Quaternion): Matrix4
matrix4Scaling(scale: Vector3): Matrix4
matrix4TRS(translation: Vector3, rotation: Quaternion, scale: Vector3): Matrix4
```
Generates common transform matrices for moving, rotating, scaling, or combining all three at once.

- **Parameters**: `translation`, `rotation`, `scale` depending on the helper.
- **Returns**: `Matrix4`.
- **Example**:
```ts
const trs = api.math.matrix4TRS(
    api.math.vector3(5, 1, -3),
    api.math.quaternionFromEuler(0, 45, 0),
    api.math.vector3(1, 1, 1)
);
```

### matrix4Perspective / matrix4Orthographic / matrix4LookAt
```ts
matrix4Perspective(fov: number, aspect: number, near: number, far: number): Matrix4
matrix4Orthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): Matrix4
matrix4LookAt(eye: Vector3, target: Vector3, up: Vector3): Matrix4
```
Builds projection and view matrices for camera math.

- **Parameters**: Standard camera numbers (fov/aspect/near/far) or frustum bounds for ortho, plus eye/target/up for look-at.
- **Returns**: `Matrix4`.
- **When to use**: Rendering helpers, minimap cameras, or any place you need a view-projection pair.
- **Example**:
```ts
const view = api.math.matrix4LookAt(eye, target, api.math.getVector3Up());
const proj = api.math.matrix4Perspective(70, 16 / 9, 0.1, 500);
```

## Transform Helper

### transform
```ts
transform(position?: Vector3, rotation?: Quaternion, scale?: Vector3): Transform
```
Convenience wrapper bundling position/rotation/scale into a single object.

- **Parameters**: Optional `position`, `rotation`, `scale`; omit to use defaults.
- **Returns**: `Transform`.
- **When to use**: Passing combined pose data into APIs that expect a transform instead of separate pieces.


 Defaults to identity pose; make sure you set scale when non-uniform scaling is needed.
- **Example**:
```ts
const pose = api.math.transform(
    api.math.vector3(0, 75, 0),
    api.math.quaternionFromEuler(0, 30, 0)
);
```

## Constants

### Direction and numeric constants
```ts
getVector3Zero(): Vector3
getVector3One(): Vector3
getVector3Up(): Vector3
getVector3Down(): Vector3
getVector3Left(): Vector3
getVector3Right(): Vector3
getVector3Forward(): Vector3
getVector3Backward(): Vector3
getQuaternionIdentity(): Quaternion
getPI(): number
getTWO_PI(): number
getHALF_PI(): number
getDEG_TO_RAD(): number
getRAD_TO_DEG(): number
getEPSILON(): number
```
Ready-made vectors, quaternions, and scalar constants to avoid retyping magic numbers.

- **Parameters**: None.
- **Returns**: Direction vectors, identity quaternion, and scalar constants.
- **When to use**: Default directions, unit conversions, or tolerance checks.


 Treat `EPSILON` as a small threshold-not a tolerance for every calculation.
- **Example**:
```ts
const forward = api.math.getVector3Forward();
const radians = 45 * api.math.getDEG_TO_RAD();
```
