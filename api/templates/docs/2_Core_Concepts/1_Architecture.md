# Architecture

Understanding how Moud is structured will help you write better games, diagnose problems faster, and design around the engine's actual constraints rather than fighting it.

Understand how Moud works will help you write better games and design around the engine's actual constraints rather than fighting it.

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

### Key Editor Keybindings

| Key | Action |
|---|---|
| **F8** | Toggle the editor overlay |
| **F7** | Toggle play-in-viewport mode |
| **F9** | Toggle collision debug overlay |

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
