# Sprite sheet JSON format

The `AnimatedSprite3D` and `AnimatedTextureRect` nodes utilize `*.animation.json` files to evaluate and execute sprite animation sequences. The parser natively supports both Aseprite's JSON Hash and JSON Array export formats. 

The JSON data dictates frame boundaries and playback logic, but does not contain image data. It must be paired with a corresponding texture asset (e.g., `.png`) referenced within the node's properties.

---

## Top-level structure

The root JSON hierarchy requires a `frames` property containing the frame data, and a `meta` property defining global configuration parameters.

```json
{
  "frames": { ... } | [ ... ],
  "meta": {
    "size": { "w": <int>, "h": <int> },
    "frameTags": [ ... ]
  }
}
```

The parser accepts two structural formats for the `frames` property:
*   **Hash:** An object where each key represents a unique frame name. The parser preserves explicit string names.
*   **Array:** An ordered list of frame objects. The parser automatically synthesizes sequential identifiers (e.g., `frame_0`, `frame_1`).

*Note: The engine will reject and fail to parse any JSON file containing zero frames.*

---

## Frame data (`frames`)

Each frame entry requires specific coordinate data to map the texture atlas to the rendering plane.

| Property | Type | Required | Description |
|---|---|---|---|
| `frame` | `{ x, y, w, h }` | Yes | The absolute pixel rectangle bounding the frame on the source texture atlas. |
| `spriteSourceSize` | `{ x, y, w, h }` | No | The pixel rectangle within the original, untrimmed canvas. Used to compute transform offsets for trimmed frames. Defaults to `frame`. |
| `sourceSize` | `{ w, h }` | No | The absolute pixel dimensions of the original source canvas. Defaults to `frame.w` and `frame.h`. |
| `duration` | int | No | Display duration in milliseconds. The minimum evaluation is `1`. Defaults to `100`. |
| `rotated` | bool | No | Evaluates as `true` if the frame is stored rotated 90 degrees on the texture atlas. Defaults to `false`. |
| `trimmed` | bool | No | Evaluates as `true` if transparent boundary pixels were discarded during texture export. Defaults to `false`. |

**Example (Hash format):**

```json
"frames": {
  "idle_0": {
    "frame":            { "x": 0, "y": 0, "w": 32, "h": 32 },
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize":       { "w": 32, "h": 32 },
    "duration": 100,
    "rotated": false,
    "trimmed": false
  },
  "idle_1": { ... },
  "run_0":  { ... }
}
```

---

## Metadata (`meta`)

### Texture dimensions (`meta.size`)

The `size` property defines the total pixel width and height of the associated texture atlas. The renderer evaluates this vector to calculate accurate UV coordinates for individual frame rectangles.

```json
"meta": {
  "size": { "w": 256, "h": 128 }
}
```

```hint warning UV alignment
If `meta.size` is omitted, the parser calculates UV coordinates based solely on local frame dimensions. This can introduce sub-pixel alignment artifacts during rendering. Explicitly declaring the texture atlas size is recommended.
```

### Animations (`meta.frameTags`)

The `frameTags` array explicitly groups subsets of frames into named animation sequences. Each object within the array defines a contiguous frame range and playback behavior.

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | The animation identifier utilized at runtime via scripts (e.g., `"idle"`, `"run"`). |
| `from` | int | Yes | The starting frame index (zero-based). |
| `to` | int | Yes | The final frame index (inclusive, zero-based). Must evaluate `>= from`. |
| `direction` | string | No | The playback iteration mode. Accepts `"forward"`, `"reverse"`, or `"pingpong"`. Defaults to `"forward"`. |

**Example:**

```json
"meta": {
  "size": { "w": 256, "h": 128 },
  "frameTags": [
    { "name": "idle", "from": 0,  "to": 3,  "direction": "forward" },
    { "name": "run",  "from": 4,  "to": 11, "direction": "forward" },
    { "name": "jump", "from": 12, "to": 14, "direction": "pingpong" }
  ]
}
```

If the `frameTags` array is entirely omitted, the parser automatically synthesizes a single `"default"` animation sequence that iterates through all available frames sequentially.
