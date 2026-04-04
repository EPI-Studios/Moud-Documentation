# Installing Moud

Welcome to Moud! Moud is a game engine that runs inside Minecraft. You build your game with scenes, scripts, materials and shaders, and Moud makes it playable on a Minecraft server with a custom Fabric client.

To get going, you need three things: the Moud server, the Moud client, and a project folder. The whole setup only takes a few minutes.

## System Requirements

| Requirement | Details |
|---|---|
| Java | 21 (Java 25 for LUAU scripting) |
| Minecraft | 1.21.1 with Fabric loader |
| OS | Windows, macOS (not fully supported), or Linux |
| RAM | ~2 GB minimum for the server, more for large scenes |

```hint important Java 21 is required
Moud uses GraalVM's JavaScript and Luau engines which require Java 25+. If you're not sure which Java you have, run `java -version` in a terminal.
```

## Installing the Server

The Moud server is a standalone Java application built on [Minestom](https://minestom.net/). It does not need a vanilla Minecraft server.

1. Download or build `server-minestom.jar` from the Moud repository
2. Place it in a folder of your choice
3. Set the environment variable `MOUD_PROJECT_ROOT` to point at your game project:

```bash
# Linux / macOS
export MOUD_PROJECT_ROOT=/path/to/my-game

# Windows (PowerShell)
$env:MOUD_PROJECT_ROOT = "C:\path\to\my-game"
```

4. Set the server mode:

```bash
# dev mode - enables the in-game editor, file saving, and asset uploads
export MOUD_MODE=dev

# player mode - read-only runtime, no editor
export MOUD_MODE=player
```

5. Start the server:

```bash
java -jar server-minestom.jar
```

The server will load your project, start the scripting engine, and begin listening for client connections.

## Installing the Client

The Moud client is a Fabric mod that replaces the default Minecraft renderer with Moud's scene renderer.

1. Install [Fabric Loader](https://fabricmc.net/) for Minecraft 1.21.1
2. Place the `client-fabric.jar` mod into your Minecraft `mods/` folder
3. Launch Minecraft with the Fabric profile
4. Connect to your Moud server (default: `localhost:25565`)

```hint important First launch
On first launch the client will download any assets your project needs from the server. This can take a moment for large projects.
```

## Next Steps

Head to [Configuration](/1_Getting_Started/2_Configuration) to learn about the project file, or jump straight to [Your First Project](/1_Getting_Started/3_First_Project) to build something.
