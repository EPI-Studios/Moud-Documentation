# Installation

Welcome to Moud, a game engine that runs inside Minecraft. You build games with scenes, scripts, materials, and shaders; Moud makes them playable on a Minestom server with a custom Fabric client mod.

This guide walks you through installing every component, verifying the setup, and understanding what happens on first launch.

![Moud running in a terminal alongside Minecraft with the custom client connected](placeholder)

---

## System Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| Java | 25 | 25  |
| Minecraft | 1.21.1 | 1.21.1 |
| Fabric Loader | 0.15+ | Latest stable |
| RAM (server) | 2 GB | 4–6 GB for large scenes |
| RAM (client) | 2 GB | 4 GB |
| OS | Windows 10, Linux | Linux (because less slop) |

```hint warning Java version matters
**Luau** scripting requires Java 25 (GraalVM 25+). If you only Run `java -version` to check what you have.
```

```hint info macOS support
macOS is not fully supported. The server runs, but the client rendering backend may have issues on Apple devices.
```

---

## What You're Installing

Moud has 3 pieces:

| Component | What it is | Who runs it |
|---|---|---|
| **Moud Server** | The server that the players will join | A server (you)|
| **Moud Client Mod** | Fabric mod for Minecraft | Each player |
| **Your Project** | Folder of scenes, scripts, assets | On the server machine |


---

## Step 1 - Install the Moud Server

### Download

**TODO**

### Create a Project Folder

Your project folder is where Moud reads your game from.
It will look like this at first: 

![project prompt](https://files.catbox.moe/cipj8u.png)


```text
my-game/
└── project.moud.json
```

### Set Environment Variables

Moud is configured via environment variables, not command-line flags:

```bash
# Linux / macOS
export MOUD_PROJECT_ROOT=/path/to/my-game
export MOUD_MODE=dev

# Windows (PowerShell)
$env:MOUD_PROJECT_ROOT = "C:\path\to\my-game"
$env:MOUD_MODE = "dev"
```

| Variable | Required | Values | Description |
|---|---|---|---|
| `MOUD_PROJECT_ROOT` | Yes | Any directory path | Root of your game project |
| `MOUD_MODE` | Yes | `dev`, `player` | Controls editor access and hot-reload |

### Start the Server

```bash
java -Xmx4G -jar server-minestom.jar
```

You should see output like:


![Moud server startup output in a terminal window](https://files.catbox.moe/c9m0m2.png)

```hint tip Keep the terminal open
The server runs in the foreground. Use a terminal multiplexer like `tmux` or `screen` if you want it to persist after closing your shell. Pressing Ctrl+C shuts it down cleanly.
```

---

## Step 2 - Install the Moud Client Mod

### Prerequisites

** TODO**

---

## Step 3 - Connect

1. Launch Minecraft using the **Fabric 1.21.1** profile in the Minecraft Launcher.
2. Click **Multiplayer → Direct Connection**.
3. Enter `localhost:25565` (or your server's IP).
4. Click **Join Server**.

---


## Troubleshooting

### Server won't start - "MOUD_PROJECT_ROOT not set"

You must set the environment variable before running the JAR. Verify with:

```bash
echo $MOUD_PROJECT_ROOT    # Linux / macOS
echo $env:MOUD_PROJECT_ROOT # Windows PowerShell
```

If empty, set it and try again.

### Server won't start - "Port 25565 already in use"

Another process is using the default Minecraft port. Options:
- Stop the conflicting process (`lsof -i :25565` on Linux to find it)
- Or configure Moud to use a different port in your project config

### Java version error - "UnsupportedClassVersionError"

Your Java is too old. Moud requires Java 21+. Install it:

```bash
# Ubuntu / Debian
sudo apt install openjdk-21-jdk

# Arch Linux
sudo pacman -S jdk21-openjdk

# Windows - download from https://adoptium.net/
```

Then verify: `java -version`

---