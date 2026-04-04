# Your First Project

In this tutorial, you will create a small Moud project from scratch. By the end you will have a floor to stand on, a spawn point, a script that logs to the console, and a collectible orb you can pick up. It should take about 10 minutes.

## Step 1: Create the Project File

Make a new folder and add `project.moud.json`:

```json
{
  "format": 1,
  "name": "My First Game",
  "author": "you"
}
```

## Step 2: Create Your First Scene

Create `scenes/main.moud.scene`:

```json
{
  "format": 1,
  "sceneId": "main",
  "displayName": "Main",
  "nodes": [
    {
      "id": 1,
      "parent": 0,
      "name": "Spawn",
      "type": "PlayerStart",
      "properties": {
        "x": "0",
        "y": "5",
        "z": "0"
      }
    },
    {
      "id": 2,
      "parent": 0,
      "name": "Floor",
      "type": "CSGBox",
      "properties": {
        "x": "0",
        "y": "-1",
        "z": "0",
        "sx": "50",
        "sy": "1",
        "sz": "50",
        "solid": "true",
        "collision_layer": "1",
        "collision_mask": "1",
        "mesh": "cube",
        "texture": "moud:dynamic/white",
        "color_tint_r": "0.3",
        "color_tint_g": "0.6",
        "color_tint_b": "0.3",
        "opacity": "1"
      }
    },
    {
      "id": 3,
      "parent": 0,
      "name": "Sun",
      "type": "DirectionalLight3D",
      "properties": {
        "rx": "120",
        "ry": "45",
        "brightness": "0.5",
        "enabled": "true",
        "color_r": "1",
        "color_g": "0.95",
        "color_b": "0.85"
      }
    },
    {
      "id": 4,
      "parent": 0,
      "name": "Logic",
      "type": "Node3D",
      "properties": {
        "script": "scripts/hello.js"
      }
    }
  ]
}
```

This scene has four nodes:

- **Spawn** - a `PlayerStart` that tells the server where to place joining players
- **Floor** - a `CSGBox` with collision so players don't fall through the world
- **Sun** - a `DirectionalLight3D` for basic illumination
- **Logic** - a `Node3D` with a script attached

## Step 3: Write Your First Script

Create `scripts/hello.js`:

````tabs
--- tab: JavaScript
```js
({
  _ready(api) {
    api.log("Hello from Moud!");
  },

  _process(api, dt) {
    // This runs every server tick.
    // dt is the time in seconds since the last tick.
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_ready(api)
    api.log("Hello from Moud!")
end

function script:_process(api, dt)
    -- This runs every server tick.
    -- dt is the time in seconds since the last tick.
end

return script
```
````

When the server loads your scene, it will print `Hello from Moud!` to the console. The `_process` callback runs every tick so you can add gameplay logic there later.

## Step 4: Run It

```bash
export MOUD_PROJECT_ROOT=/path/to/your-project
export MOUD_MODE=dev
java -jar server-minestom.jar
```

Connect with the Fabric client. You should spawn on the green floor with the sun overhead.

## Step 5: Add a Trigger Zone

Now let's add something interactive. We will create an `Area3D` that teleports the player when they walk into it.

Add this node to the `nodes` array in `main.moud.scene`:

```json
{
  "id": 5,
  "parent": 0,
  "name": "LaunchPad",
  "type": "Area3D",
  "properties": {
    "x": "8",
    "y": "0",
    "z": "0",
    "shape": "box",
    "sx": "3",
    "sy": "1",
    "sz": "3",
    "monitoring": "true",
    "collision_layer": "1",
    "collision_mask": "1",
    "script": "scripts/launchpad.js"
  }
}
```

Then create `scripts/launchpad.js`:

````tabs
--- tab: JavaScript
```js
({
  _enter_tree(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_enter");
  },

  _on_enter(playerUuid) {
    this.api.teleportPlayer(playerUuid, 0, 20, 0);
    this.api.log("Launched " + playerUuid + " into the sky!");
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_enter_tree(api)
    self.api = api
    api.connect(api.id(), "area_entered", api.id(), "_on_enter")
end

function script:_on_enter(playerUuid)
    self.api:teleportPlayer(playerUuid, 0, 20, 0)
    self.api:log("Launched " .. playerUuid .. " into the sky!")
end

return script
```
````

Walk onto the launch pad and you get teleported 20 blocks up. That is the core pattern for interactive gameplay in Moud: place an `Area3D`, connect its `area_entered` signal, and react in your script.

## Next Steps

- Read [Architecture](/2_Core_Concepts/1_Architecture) to understand how the server, client, and scripting fit together
- Read [Scenes and Nodes](/2_Core_Concepts/3_Scenes_and_Nodes) for a deep dive into the node system
- Browse the [Scripting API Reference](/4_Scripting/01_Script_API_Overview) for the full list of `api` methods
