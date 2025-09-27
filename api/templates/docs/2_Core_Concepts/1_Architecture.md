# Moud Architecture

Understanding Moud's architecture is key to developing IN THE RIGHT WAY. 
Moud is built around a clean separation between the client and the server, which communicate via a custom network layer and share a common scripting logic.

## Overview

Here is a simplified diagram of the architecture:
(coming soon)

### The Server (Moud Engine)

The server is the heart of your game. It is a standalone Java application and **not** a Bukkit or Spigot plugin.

-   **Foundation:** It uses [Minestom](https://minestom.net/), an open-source, lightweight Minecraft server built from the ground up.

-   **Game Logic:** Your game logic is written in JavaScript/TypeScript and executed by the **GraalVM** engine. This is where you handle events (`player.join`), modify the world (`world.setBlock`), and control entities.

-   **Authority:** The server is the source of truth. It manages the game state, validates actions, and decides what information to send to clients.

-   **Script Distribution:** When a Moud client connects, the server sends it a compressed pack (`.zip`) containing the necessary client scripts and assets (textures, sounds, animations).

### The Client (Moud Mod)

The client is a **Fabric mod** that players must install. Its role is to render the game and execute client-specific logic.

-   **Rendering:** It is responsible for everything visual. By integrating libraries like [Veil](https://github.com/FoundryMC/Veil) and [PlayerAnimationLib](https://github.com/ZigyTheBird/PlayerAnimationLibrary/tree/main), it can handle complex player animations, post-processing effects, dynamic lighting, and much more.

-   **JS Runtime:** Like the server, it has a GraalVM engine to execute the scripts it receives from the server.

-   **User Interface (UI):** Client scripts can create HTML/CSS-like UI elements that are rendered over the game, allowing for fully custom HUDs and menus.

-   **Responsiveness:** It handles direct player input (keyboard, mouse) and can have reactive logic without waiting for a server response for every action (e.g., for UI animations).

### The Communication Layer

The magic of Moud lies in the seamless communication between the client and server.

-   **Custom Events:** The server can send targeted events to a client (`player.getClient().send(...)`), and the client can send events back to the server.

-   **Shared Values:** This is the primary state synchronization system. The server can set a value (e.g., `player.mana = 80`) in a shared "store" and the client is automatically notified of the change, allowing it to update the UI or other stuff in real-time.