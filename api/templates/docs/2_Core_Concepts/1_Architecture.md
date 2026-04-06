# Architecture

Understanding how Moud is put together will help you write better games. If you know what runs where and how the pieces communicate, you will have a much easier time debugging problems and designing your gameplay.


The client does not run gameplay logic. It is a display and input layer.

### The Scene Tree

The scene tree is the central data structure. It's a tree of **nodes**, where each node has:

- A numeric **ID** (unique within the scene)
- A **type** (like `Node3D`, `Camera3D`, `RigidBody3D`, `Label`)
- A **name** (human-readable)
- A **parent** (another node, or `0` for root-level)
- A bag of **properties** (string key-value pairs)

When your script calls `api.set("x", "10")`, that's a scene operation. The server applies it to the tree, then replicates it to all connected clients. The client sees the property change and updates the render accordingly.

## How Scripts Fit In

Every node can have a `script` property pointing to a `.ts`, `.js`, or `.luau` file. When the scene loads, the server's scripting engine:

1. Reads and evaluates the script file
2. Creates a script instance bound to that node
3. Calls lifecycle hooks as the node enters the tree and each tick

The script receives an `api` object that lets it interact with the scene tree, physics, cameras, players, and more. See [Events](/2_Core_Concepts/2_Events) for the full lifecycle.

## Server-Authoritative Model

Moud is fully server-authoritative:

- All gameplay scripts execute on the server
- Physics bodies are simulated on the server
- The server sends the final scene state to clients
- Clients send raw input (movement vector, look angles, jump/sprint flags)
- The server processes that input in your scripts

This means:

- **You don't need to worry about client-side prediction** for most gameplay
- **Players can't tamper with game state** by modifying their client
- **All game logic is in one place** - your server scripts
- **Network latency** is the tradeoff - design around a reliable 20 Hz server tick

## Data Flow Summary

1. Player presses W → client sends `moveZ: 1.0` to server
2. Server delivers input to your script via `api.input()` or `_input(api, event)`
3. Your script calls `api.setNumber("x", newX)` to move the node
4. Server batches the property change into a scene operation
5. Client receives the operation and updates the rendered position

This loop runs every server tick (~50ms at 20 Hz).
