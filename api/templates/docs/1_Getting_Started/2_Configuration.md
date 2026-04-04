# Configuration

Every Moud project starts with a single file: `project.moud.json`. It tells the server where your game lives and gives it a name. That's really all you need to get started.

## Project File

Create `project.moud.json` in your project root:

```json
{
  "format": 1,
  "name": "My Game",
  "author": "your-name"
}
```

That's it. There is no build step, no bundler, no config framework. Moud reads this file, finds your scenes and scripts relative to it, and starts your game.

## Project Layout

A typical Moud project looks like this:

```text
my-game/
├── project.moud.json          # project metadata
├── scenes/
│   ├── main.moud.scene        # your main scene
│   ├── hud.moud.scene         # a UI overlay scene
│   └── dungeon.moud.scene     # another level
├── scripts/
│   ├── player.js              # JavaScript gameplay script
│   ├── collectible.js
│   ├── grass.luau             # Luau gameplay script
│   └── score.js
└── assets/
    ├── manifest.tsv           # asset hash → path mapping
    ├── materials/
    │   └── grass.moudmat      # material definition
    ├── shaders/
    │   └── grass.moudshader   # GLSL shader
    ├── textures/
    │   └── stone.png
    ├── models/
    └── blobs/                 # content-addressed asset storage
```

## Path Conventions

Moud uses two kinds of paths:

### Script Paths

Scripts are referenced from the project root. When you set a node's `script` property, use a path relative to the project:

```text
scripts/player.js
scripts/grass.luau
```

### Asset Paths (`res://`)

Textures, materials, shaders, and models use `res://` paths. These map into the `assets/` folder:

```text
res://textures/stone.png      → assets/textures/stone.png
res://materials/grass.moudmat  → assets/materials/grass.moudmat
res://shaders/grass.moudshader → assets/shaders/grass.moudshader
```

There is also a built-in prefix `moud:` for engine-provided resources:

```text
moud:dynamic/white    # a plain white texture
```

## Server Modes

| Mode | What It Does |
|---|---|
| `dev` | Full access: in-game editor, scene saving, asset uploads, script hot-reload |
| `player` | Read-only runtime: no editor, no mutation, just gameplay |

Set the mode with the `MOUD_MODE` environment variable before starting the server.

