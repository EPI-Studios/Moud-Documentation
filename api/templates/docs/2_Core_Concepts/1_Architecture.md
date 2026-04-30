# Architecture

Understanding how Moud is structured will help you write better games, diagnose problems faster, and design around the engine's actual constraints rather than fighting it.

---

## The Two Sides of Moud

Moud is split across two JVM processes:

| Side | Technology | What it owns |
|---|---|---|
| **Server** | Minestom (headless Minecraft server) | Scene graph, physics, scripting, game state |
| **Client** | Fabric mod (Minecraft client) | Rendering, input capture, editor UI, audio playback |

These two processes communicate over the standard Minecraft plugin-message channel (`moud:engine`), shared into three logical **lanes**:

- `STATE` - scene snapshots, scene operations, physics updates, runtime state
- `EVENTS` - player input, respawn requests, UI events
- `ASSETS` - manifest, upload, download of resource files

**The client is a display and input layer only.** It has no knowledge of gameplay rules. All game logic runs on the server.

---

## The Minestom Server

The **20 Hz tick rate** is fixed. All gameplay scripts, physics steps, and scene operation batches happen at this cadence.

The server is configured entirely via environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `MOUD_PROJECT_ROOT` | `.` | Path to the project directory |
| `MOUD_MODE` | `dev` | `dev` enables hot-reload, editor, uploads. `player` disables them. |

---

## The Fabric Client

### Editor keybindings

The editor exposes a full set of standard hotkeys in addition to the engine-specific function keys. All shortcuts apply when the editor overlay is open and focused; when it is closed the F-keys still toggle modes.

**Engine modes**

| Key | Action |
|---|---|
| **F7** | Toggle play-in-viewport mode |
| **F8** | Toggle the editor overlay |
| **F9** | Toggle collision debug overlay |

**File operations**

| Shortcut | Action |
|---|---|
| **Ctrl + S** | Save the active scene to disk |
| **Ctrl + P** | Open the quick search palette (jump to a node, asset, or command) |

**Edit / undo**

| Shortcut | Action |
|---|---|
| **Ctrl + Z** | Undo the last scene mutation |
| **Ctrl + Y** | Redo |
| **Ctrl + Shift + Z** | Redo (alternate binding) |

**Scene tree manipulation**

| Shortcut | Action |
|---|---|
| **Ctrl + C** | Copy the selected node (and its subtree) |
| **Ctrl + X** | Cut the selected node |
| **Ctrl + V** | Paste at the current selection |
| **Ctrl + D** | Duplicate the selected node in place |
| **Ctrl + Shift + D** | Duplicate with a small snap offset, useful for laying out grid-aligned copies |
| **Delete** | Free the selected node |

**Transform nudging** (with a node selected in the viewport)

| Shortcut | Action |
|---|---|
| **Arrow keys** | Nudge the node by one snap unit on the active axis |
| **Shift + Arrow keys** | Nudge by ten snap units |
| **[** / **]** | Move the node up/down in its parent's child list (changes Z-order for UI, draw order for 2D) |

---

## The Scene Graph

The scene graph is Moud's central data structure. It is a tree of **nodes**, owned entirely by the server.

Picture of the sceen tree

Each node has:

| Field | Type | Description |
|---|---|---|
| `nodeId` | `long` | Unique numeric ID within the scene, assigned by the server |
| `name` | `String` | Human-readable label |
| `type` | `String` | Node type name (`Node3D`, `Camera3D`, `RigidBody3D`, etc.) |
| `parentId` | `long` | ID of the parent node; `0` means direct child of root |
| `properties` | `Map<String,String>` | All property values as strings |

```hint warning Properties Are Always Strings
Properties are **always strings** - numbers, booleans, colors, and resource paths are all serialized to and from their string representation. `api.set("x", "10.5")` writes the string `"10.5"` to the `x` property key.
```

### Multiple Scenes

`ServerScenes` manages a collection of `ServerScene` objects. Each scene has its own Minecraft `InstanceContainer`, its own `Engine`, and its own `JoltPhysicsWorld`. Players can be teleported between instances via scene transitions.

The default scene is always named `"main"` and is created automatically at startup.

---

## Client Scripts

Any node can also carry a `client_script` property - a path to a **Luau** file that runs on the Fabric client, not the server. Client scripts execute every render frame (~60 Hz) and are the correct place for any thing that should feel instant.

Client scripts are written in **Luau** and receive a different API surface from server scripts:

| Global | Description |
|---|---|
| `node` | Read-only snapshot of this node's server-authoritative properties |
| `body` | Physics read/write - CharacterBody3D only; runs before the frame integrator |
| `input` | Local keyboard/mouse state this exact frame |
| `timer` | Named countdown timers |
| `anim` | PAL animation playback and bone overrides |
| `render` | Per-frame visual overrides (tint, visibility, shader uniforms) |

```hint info Client Scripts Cannot Modify Authoritative State
Client scripts **cannot** modify authoritative game state. They cannot spawn nodes, change server-owned properties, or send network messages. The server corrects any prediction divergence via its normal sync packets. See [Client Scripts](/4_Scripting/10_Client_Scripts) for the full reference.
```

---

## How Players Get Your Game

Moud's distribution model differs from most engines. **Players never download your game files.** They install only the Moud Fabric mod once, and from then on they connect to any Moud server the same way they would join a vanilla Minecraft server.

When a player joins:

1. The Fabric client opens a session against the server's port (default `25565`).
2. The server streams the active scene's nodes, materials, scripts, and asset payloads down the `ASSETS` lane on demand. The client caches them locally so subsequent joins to the same server skip the transfer.
3. Scripts run server-authoritatively; client scripts ship as part of the same asset stream and execute locally.
4. Switching scenes mid-session streams only the diff.

This means a server owner ships nothing to players directly: no installers, no manual updates, no per-game launcher entries. Pushing a new scene file or asset to the server makes it available to every player on their next reload, with hot-reload also covering live editor sessions in `MOUD_MODE=dev`.

The same property holds for hosted multiplayer experiences: a Moud server can host many `places` (scenes), each with its own gameplay. Players match into instances of those places via the multi-instance runtime described in [Multi-Instance Runtime](/4_Scripting/18_Multi_Instance), with the matchmaker spawning new instances on demand. From the player's perspective there is one entry point: the server address.

What this means for distributors:

- **You publish a server, not a game.** Update the server, every connected player gets the new content.
- **No platform store dependency.** Discord links, web pages, or [`moud://` deep links](/3_Features/16_Deep_Linking) are all valid entry points.
- **Asset budgeting matters.** First-time joiners pay the asset stream cost. Use the cache by reusing materials and meshes across scenes; very large textures are the most common cause of slow first-joins.

