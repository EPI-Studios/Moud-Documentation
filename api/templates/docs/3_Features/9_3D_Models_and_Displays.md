
# 3D Models and Displays

Moud lets you script a set of visual elements directly from TypeScript: **3D models**, **text displays**, and **media displays** (referred to here as *Screens*). 

## 1. Preparing Assets

All assets should live under `assets/<namespace>/...` so the CLI can discover and bundle them correctly:

```
assets/
└─ moud/
   ├─ models/
   │  ├─ statue.obj
   │  └─ console.gltf
   ├─ textures/
   │  ├─ statue.png
   │  └─ screen_frame.png
   └─ displays/
      └─ video_placeholder.png
```

Supported formats:

* **Models**: `.obj`
* **Textures**: `.png`, `.jpg`
* **Display content**: textures, or remote URLs for video streams (doesn't work well)

Assets are referenced using the form `namespace:path`.
For example, `assets/moud/models/statue.obj` becomes:

```
moud:models/statue.obj
```

---

## 2. Spawning 3D Models

You can create a model entity using `world.createModel`:

```ts
const art = api.world.createModel({
  model: 'moud:models/statue.obj',
  texture: 'moud:textures/statue.png',
  position: api.math.vector3(2, 65, -3),
  rotation: api.math.quaternionFromEuler(0, 45, 0),
  scale: api.math.vector3(1.2, 1.2, 1.2),
  collision: {
    width: 1.2,
    height: 2.4,
    depth: 1.0
  }
});
```

### `createModel` options

| Option      | Description                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `model`     | Required asset ID for the mesh.                                                                                                        |
| `position`  | World coordinates (defaults to `0, 0, 0`).                                                                                             |
| `rotation`  | Quaternion or Euler angles.                                                                                                            |
| `scale`     | Per-axis scale (`Vector3.one()` by default).                                                                                           |
| `texture`   | Optional texture override for the model material.                                                                                      |
| `collision` | `true`, `false`, or a custom box (`width/height/depth`). If omitted, a box is inferred from the scale so the model can receive clicks. |
| `collisionMode` | Optional collision mode hint (`auto`, `convex`, `mesh`, ...).                                                                      |
| `anchor`    | Optional parenting/attachment configuration (follow blocks/entities/players/models).                                                   |

The returned `Model` instance can be updated at runtime:

```ts
art.setRotationFromEuler(0, (Date.now() / 40) % 360, 0);
art.setTexture('moud:textures/statue_glow.png');
// collision bounds are configured at spawn time via createModel({ collision: ... }).
// if you need to change collision bounds later, recreate the model.
```

Call `art.remove()` when the model should be cleaned up.

---

## 3. Text Displays

For in-world labels and text panels, use `world.createText`. This wraps Minecraft’s text display entity/

```ts
const label = api.world.createText({
  position: api.math.vector3(5.5, 67, 5.5),
  content: 'rabbit',
  billboard: 'center', // fixed | vertical | horizontal | center
  hitbox: { width: 2.5, height: 1.2 }
});
```

You can update text and styling dynamically:

```ts
label.setText('panda');
label.setColor(0, 255, 128);
label.setBackgroundColor(0xAA112233);
```

Notes:

* `billboard` controls how the text faces the viewer.
* `hitbox` is optional and enables hover or click interaction.
* Additional helpers like `setShadow`, `setTextOpacity`, and `setLineWidth` are available on the `Text` instance.

---

## 4. Screens and Media Displays

`world.createDisplay` is the API for holograms, slideshows, and video surfaces. Each display is a quad that can be positioned freely or anchored to a block or entity, with configurable content and playback.

```ts
const screen = api.world.createDisplay({
  position: api.math.vector3(-2, 68, 4),
  scale: api.math.vector3(4, 2.25, 0.2),
  rotation: api.math.quaternionFromEuler(0, 90, 0),
  anchor: {
    type: 'block',
    x: -2,
    y: 65,
    z: 4,
    offset: api.math.vector3(0.5, 3, 0)
  },
  content: {
    type: 'frames',
    frames: [
      'moud:textures/displays/frame1.png',
      'moud:textures/displays/frame2.png',
      'moud:textures/displays/frame3.png'
    ],
    fps: 2,
    loop: true
  },
  playback: {
    playing: true,
    speed: 1.0
  }
});
```

### Supported content types

| Type                       | Properties                | Typical use                            |
| -------------------------- | ------------------------- | -------------------------------------- |
| `image` / `texture`        | `source`                  | Static posters or signage.             |
| `frames`                   | `frames[]`, `fps`, `loop` | Slideshows or sprite-style animations. |
| `video` / `url` / `stream` | `source`, `fps`, `loop`   | MP4 or HTTP video streams.             |

### Anchoring displays

Displays can follow a block or entity automatically:

```ts
anchor: {
  type: 'entity',
  uuid: npcUuid,
  offset: api.math.vector3(0, 1.8, 0)
}
```

Available anchor types are `free` (default), `block`, and `entity`/`player`.

### Playback control

```ts
screen.setPlaybackSpeed(0.5);
screen.seek(12.3); // jump to 12.3 seconds
screen.pause();
screen.play();
```

---
