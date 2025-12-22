
# Player Animation System

Moud’s player animationuse [PlayerAnimationLib](https://github.com/ZigyTheBird/PlayerAnimationLibrary), the Fabric mod, and a set of proxies exposed through `player.animation`. You get two complementary approaches:

1. **Keyframe playback** – export Blockbench animations, package them in `assets/`, and trigger them by id with easing/fade support.
2. **Procedural control** – manipulate any body part (position/rotation/scale/visibility) per tick, override first-person limbs, and smoothly blend between poses.

You can mix both; for example play a keyframe animation while procedurally moving the head toward a target.

## Preparing Assets

1. Animate a player model in Blockbench.
2. Export as **Bedrock Animation** (`.json`).
3. Place the file under `assets/<namespace>/player_animations/` or simply `assets/<namespace>/animations/`. `ClientScriptManager` repaths files automatically when packaging.
4. The animation id becomes `<namespace>:<filename>`. Example: `assets/moud/animations/wave.json` → `moud:wave`.

```hint info Namespaces
Use your project namespace (folder name under `assets/`). This keeps animations from different modules from colliding.
```

## Playing Keyframe Animations

```ts
api.on('player.chat', (event) => {
  if (event.getMessage() === '!wave') {
    event.cancel();
    event.getPlayer().animation.playAnimation('moud:wave', {
      fade: true,
      fadeDuration: 400    // milliseconds
    });
  }
});
```

## Procedural Posing

Use `setPartConfig(part, options)` for realtime control. Valid part names: `head`, `body`, `right_arm`, `left_arm`, `right_leg`, `left_leg`

```ts
player.animation.setPartConfig('right_arm', {
  rotation: api.math.vector3(-90, 0, 0),
  overrideAnimation: true,
  interpolation: {
    enabled: true,
    duration: 450,
    easing: 'ease_in_out'
  }
});
```

| Option | Description |
| --- | --- |
| `position: Vector3` | Local offset in blocks relative to the bone’s pivot. |
| `rotation: Vector3` | Euler angles (degrees) applied in XYZ order. |
| `scale: Vector3` | Non-uniform scaling per axis. |
| `visible: boolean` | Hide/show the part. |
| `overrideAnimation: boolean` | When `true`, procedural pose takes priority over any playing keyframe animation. |
| `interpolation: { enabled, duration, easing, speed }` | Smoothly blend into the new pose. Duration is in milliseconds. |

### Pointing at World Positions

`pointToPosition(position, { interpolation })` is a helper that rotates both arms toward a target.

```ts
player.animation.pointToPosition(api.math.vector3(x, y, z), {
  interpolation: { enabled: true, duration: 200 }
});
```

## First-Person & Visibility Controls

`setFirstPersonConfig` lets you customise what the player sees in first-person, useful for cinematic cameras.

```ts
player.animation.setFirstPersonConfig({
  showRightArm: false,
  showLeftArm: true,
  showRightItem: false,
  showArmor: true
});
```

`resetAllParts()` clears every override and returns to vanilla poses.

## Targeted Broadcasts

Animations always run on the client of the player you target. If you need to preview poses for other players (e.g., spectators), use `player.animation.setPartConfigWithVisibility(part, options, visibility)` where `visibility` can be `"self"`, `"others"`, or `"all"`.

## Tips


- **Drive from events** – `player.movement.start/stop` events are great entry points to trigger locomotion overrides or footstep animations
- **Camera-aware** – when using detached cameras (`player.camera.enableCustomCamera()`), manually adjust first-person visibility to prevent limbs from clipping the new view.


