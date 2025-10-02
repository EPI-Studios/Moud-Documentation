# Lighting System

Moud's lighting system enables you to create dynamic lights that go beyond vanilla Minecraft's limitations. These lights are client-rendered and can be created, modified, and removed in real-time to enhance visual atmosphere and gameplay.

## Understanding the Lighting System

### How It Works

The lighting system operates through a client-server architecture:

1. **Server creates lights** using the Lighting API
2. **Client receives light data** via network packets
3. **Client renders lights** using Veil's rendering pipeline
4. **Lights affect world appearance** in real-time

### Light Types

Moud supports two primary light types:

- **Point Lights**: Emit light in all directions from a single point
- **Area Lights**: Emit light from a rectangular surface area
- **Direction Lights** : Will be implemented later.

## Creating Lights

### Point Lights

Point lights radiate light uniformly in all directions, like torches, lamps etc..

```typescript
api.on('player.join', (player) => {
  const lighting = api.getLighting();
  
  lighting.createPointLight(
    1,                              // unique light ID
    api.vector3(10, 70, 10),        // world position
    api.vector3(1.0, 0.8, 0.4),     // RGB color (0-1 range)
    8.0,                            // radius of effect
    1.2                             // brightness intensity
  );
});
```

### Area Lights

Area lights emit from a rectangular surface, creating more realistic lighting for windows, screens, or large light sources.

```typescript
lighting.createAreaLight(
  2,                              // unique light ID
  api.vector3(15, 72, 15),        // position
  api.vector3(0, -1, 0),          // direction vector (pointing down)
  api.vector3(0.9, 0.95, 1.0),    // cool blue-white color
  4.0,                            // width
  2.0,                            // height
  0.8                             // brightness
);
```

### Light Parameters Explained

**Light ID**: Each light requires a unique numeric identifier. Use systematic numbering to avoid conflicts.

**Position**: World coordinates where the light is located. Use `api.vector3(x, y, z)`.

**Color**: RGB values between 0.0 and 1.0. Common color examples:
- Torch: `api.vector3(1.0, 0.8, 0.4)`
- Moonlight: `api.vector3(0.6, 0.7, 1.0)`
- Fire: `api.vector3(1.0, 0.4, 0.1)`
- Magic: `api.vector3(0.8, 0.3, 1.0)`

**Radius**: How far the light reaches. Larger values create softer, more distributed lighting.

**Brightness**: Light intensity. Values above 1.0 create very bright lights that can wash out colors.

## Light Control

### Updating Lights

Modify existing lights using the `updateLight()` method:

```typescript
lighting.updateLight(lightId, {
  x: newX,
  y: newY,
  z: newZ,
  r: newRed,
  g: newGreen,
  b: newBlue,
  brightness: newBrightness,
  radius: newRadius
});
```

### Removing Lights

Clean up lights when they're no longer needed:

```typescript
lighting.removeLight(lightId);
```
