# 3D Models, Text Displays & Screens

Moud ships with a handful of stuff you can script from TypeScript: custom 3D models, floating text panels, and “media displays” that behave like Screens. This page explains the workflow from asset files to runtime control so you can drop these elements into a scene.

---

## 1. Preparing Assets

Put everything under `assets/<namespace>/...` so the CLI can find it:

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

- **Models**: `.obj`, `.gltf`, `.fbx`
- **Textures**: `.png`, `.jpg`
- **Display content**: Any texture, or remote URLs for video streams

The asset ID is `namespace:path`. In the structure above, `statue.obj` becomes `moud:models/statue.obj`.

---

## 2. Spawning 3D Models

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

**Options you can pass to `createModel`:**

| Option | Description |
| --- | --- |
| `model` | Required asset id. |
| `position` | World coordinates (defaults to `0,0,0`). |
| `rotation` | Quaternion or Euler angles. |
| `scale` | Per-axis scaling (`Vector3.one()` by default). |
| `texture` | Override the material with another texture asset. |
| `collision` | `true`, `false`, or an object with `width/height/depth`. If omitted, a box is inferred from the scale so you can click the model. |

Once you have a `ModelProxy`, you can move or re-skin it later:

```ts
art.setRotationFromEuler(0, (Date.now() / 40) % 360, 0);
art.setTexture('moud:textures/statue_glow.png');
art.setCollisionBox(0, 0, 0);      // make it intangible
```

Call `art.remove()` when the sculpture should disappear.


```hint warning Does it work with axiom?
When Axiom is running, every model you spawn appears in its viewport. Adjusting the gizmo there calls back into `ModelProxy.applyBridgeTransform`, so you can tweak placement live during development.
```

---

## 3. Floating Text Displays

Use `api.world.createText` when you need Minecraft’s modern text display entity without writing raw Minestom code.

```ts
const label = api.world.createText({
  position: api.math.vector3(5.5, 67, 5.5),
  content: 'rabbit',
  billboard: 'center',   // fixed | vertical | horizontal | center
  hitbox: { width: 2.5, height: 1.2 }
});

label.setText('panda');
label.setColor(0, 255, 128);
label.setBackground('#112233aa');
```

Key things to remember:

- `billboard` controls how the panel faces the viewer.
- `hitbox` (optional) enables clicks and hover events on the text itself.
- `setShadow`, `setOpacity`, `setLineWidth`, and other helpers are available on `TextProxy` if you peek at the TypeScript declarations.

---

## 4. Screens & Media Displays

`world.createDisplay` is the catch-all for anything that looks like a hologram, slideshow. Every display is ultimately a quad that you can anchor to a block or entity and feed with different content types.

```ts
const screen = api.world.createDisplay({
  position: api.math.vector3(-2, 68, 4),
  scale: api.math.vector3(4, 2.25, 0.2),
  rotation: api.math.quaternionFromEuler(0, 90, 0),
  anchor: {
    type: 'block',
    x: -2, y: 65, z: 4,
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

### Content types you can feed

| Type | Properties | Use case |
| --- | --- | --- |
| `image` / `texture` | `source` | Static posters, signage. |
| `frames` | `frames[]`, `fps`, `loop` | Slideshows or sprite animations. |
| `video` / `url` / `stream` | `source`, `fps`, `loop` | Streams MP4/HTTP video to the client. |

### Anchoring

```ts
anchor: {
  type: 'entity',
  uuid: npcUuid,
  offset: api.math.vector3(0, 1.8, 0)
}
```

Options are `free` (default), `block`, or `entity/player`. Anchored displays follow their parent automatically.

### Playback control

```ts
screen.setPlaybackSpeed(0.5);
screen.seek(12.3);    // jump to 12.3 seconds
screen.pause();
screen.play();
```

---

## Troubleshooting

- **Model invisible?** Make sure the texture path exists and the asset id is spelled correctly. Check the game logs for “Asset not found”.
- **Videos not playing?** The client must be able to reach the URL (no auth) and it needs to point at a direct video file or HLS stream.
- **Can’t click a model?** Increase the collision box or set `collision: true` so Minestom registers pointer hits.
- **Text facing the wrong way?** Change `billboard` or set the rotation manually on the underlying entity via `label.getEntity().setRotation(...)`.

