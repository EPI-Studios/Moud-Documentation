# Camera Control System

The camera system provides complete control over player viewpoints. When activated, the camera system takes control of the player's view while making them invisible to create seamless camera experiences.

## Camera Control

### How Camera Locking Works

When you lock a camera, several things happen automatically:
1. **Player becomes invisible** to other players
2. **Player is teleported** to the camera position
3. **Movement is disabled** - player cannot move normally
4. **View is controlled** by your script instead of player input

### Basic Camera Locking

```typescript
api.on('player.chat', (event) => {
  const player = event.getPlayer();
  const message = event.getMessage();

  if (message === '!camera') {
    player.getCamera().lock(
      api.vector3(0, 100, 0),
      {
        yaw: 0,
        pitch: -45,
        smooth: true,
        speed: 1.0
      }
    );
  }
  
  if (message === '!release') {
    player.getCamera().release();
  }
});
```

### Camera Options

**Position**: World coordinates where the camera should be placed.

**Rotation Options**:
- `yaw`: Horizontal rotation (0-360 degrees)
- `pitch`: Vertical rotation (-90 to 90 degrees)  
- `roll`: Camera tilt (rarely used, usually 0)

**Movement Options**:
- `smooth`: Whether to smoothly transition to the position
- `speed`: How fast the smooth transition occurs
- `disableViewBobbing`: Removes walking bob effect
- `disableHandMovement`: Hides player hands and items

## Camera Movement

### Updating Camera Position

Move the camera while it's locked:

```typescript
function createMovingCamera(player: Player) {
  player.getCamera().lock(api.vector3(0, 80, 0));
  
  setTimeout(() => {
    player.getCamera().setPosition(api.vector3(20, 80, 20));
  }, 1000);
  
  setTimeout(() => {
    player.getCamera().setRotation({
      yaw: 45,
      pitch: -20
    });
  }, 2000);
}
```

## Camera Effects

### Camera Shake

Add impact effects with camera shake:

```typescript
player.getCamera().shake(2.0, 1000);

api.on('explosion_nearby', (player, explosionData) => {
  const distance = explosionData.distance;
  const intensity = Math.max(0.1, 2.0 / distance);
  const duration = Math.max(100, 1000 / distance);
  
  player.getCamera().shake(intensity, duration);
});
```

### Stopping Camera Movement

Immediately halt any smooth transitions:

```typescript
player.getCamera().stopAnimation();
```

## Camera State Information

### Checking Camera Status

```typescript
if (player.getCamera().isLocked()) {
  console.log("Camera is currently locked");
  console.log(`Position: ${player.getCamera().getPosition()}`);
  console.log(`Rotation: ${player.getCamera().getRotation()}`);
}
```
