# Project Structure

This is the complete reference for Moud project files and folder layout.

## Project File

Every project has a `project.moud.json` at its root:

```json
{
  "format": 1,
  "name": "My Game",
  "author": "your-name"
}
```

| Field | Type | Description |
|---|---|---|
| `format` | int | Always `1` |
| `name` | string | Display name of the project |
| `author` | string | Author name |

## Folder Layout

```text
project-root/
├── project.moud.json
├── scenes/
│   ├── main.moud.scene
│   └── *.moud.scene
├── scripts/
│   ├── *.js
│   └── *.luau
└── assets/
    ├── manifest.tsv
    ├── materials/
    │   └── *.moudmat
    ├── shaders/
    │   └── *.moudshader
    ├── textures/
    │   └── *.png, *.jpg
    ├── models/
    │   └── *.glb
    └── blobs/
        └── (content-addressed files)
```

## Path Systems

### Script Paths

Script references in node properties are project-relative:

```text
scripts/player.js
scripts/grass.luau
```

Set on nodes via the `script` property:

```json
"properties": {
  "script": "scripts/player.js"
}
```

### Asset Paths (`res://`)

All asset references use the `res://` prefix, which maps to the `assets/` folder:

```text
res://textures/stone.png      → assets/textures/stone.png
res://materials/grass.moudmat  → assets/materials/grass.moudmat
res://shaders/grass.moudshader → assets/shaders/grass.moudshader
res://models/tree.glb          → assets/models/tree.glb
```

### Built-in Assets (`moud:`)

Engine-provided resources use the `moud:` prefix:

```text
moud:dynamic/white    # plain white texture
```

## Manifest File

`assets/manifest.tsv` maps resource paths to content hashes. It is tab-separated with four columns:

```text
res://path/to/file    sha256hash    size_bytes    TYPE
```

| Column | Description |
|---|---|
| Resource path | `res://` path |
| Hash | SHA-256 of file content |
| Size | File size in bytes |
| Type | `TEXT`, `BINARY`, `IMAGE`, `MODEL`, or `AUDIO` |

The actual file data is stored in `assets/blobs/` with the hash as the filename. This deduplicates identical files.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MOUD_PROJECT_ROOT` | Yes | Absolute path to the project root folder |
| `MOUD_MODE` | No | `dev` (default) or `player` |
