# Configuration

The `project.moud.json` of a Moud poroject is what the server read to know where your game lives.

---

## Project File

Create `project.moud.json` in your project root:

```json
{
  "format": 1,
  "name": "My Game",
  "author": "your-name"
}
```

That's it. (But you can do it from the editor)

---


## Environment Variables

You need to set some environment variables before starting the server.

| Variable | Required | Default | Description |
|---|---|---|---|
| `MOUD_PROJECT_ROOT` | Yes | `.` | Absolute path to the project directory |
| `MOUD_MODE` | Yes | `dev` | Operating mode: `dev` or `player` |

### Setting Environment Variables

```bash
# Linux / macOS (bash or zsh)
export MOUD_PROJECT_ROOT=/path/to/my-game
export MOUD_MODE=dev

# Windows (PowerShell)
$env:MOUD_PROJECT_ROOT = "C:\path\to\my-game"
$env:MOUD_MODE = "dev"

# Windows (Command Prompt)
set MOUD_PROJECT_ROOT=C:\path\to\my-game
set MOUD_MODE=dev
```

---

## Server Modes

| Mode | What It Does |
|---|---|
| `dev` | Enable the in-game editor and everything that comes with it. |
| `player` | Run the game |

```hint warning
Never run `dev` mode on a public server. In `dev` mode, any connected player can modify the scene tree, upload arbitrary files, and edit scripts. Use `player` mode for public deployments.
```
---

## Path Conventions

Moud uses two kinds of paths throughout your project:

### Script Paths

Scripts are referenced relative to the project root:

```text
scripts/player.ts
scripts/enemy.luau
local_scripts/debug.ts
```
When you set a node's `script` property in the editor, the path is stored relative to the project root.

### Asset Paths (`res://`)

Textures, materials, shaders, models, and audio use `res://` paths. These map into the `assets/` folder:

```text
res://textures/stone.png       → assets/textures/stone.png
res://materials/grass.moudmat  → assets/materials/grass.moudmat
res://shaders/water.moudshader → assets/shaders/water.moudshader
res://audio/theme.ogg          → assets/audio/theme.ogg
```

There is also a built-in `moud:` prefix for engine-provided resources:

```text
moud:dynamic/white    # a gray and white grid
```
---

## Starting the Server

Once `MOUD_PROJECT_ROOT` and `MOUD_MODE` are set, start the server:

```bash
java -Xmx4G -jar server-minestom.jar
```

Recommended JVM flags:

```bash
java \
  -Xmx8G \
  -Xms2G \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=50 \
  -jar server-minestom.jar
```
---
