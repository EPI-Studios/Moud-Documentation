# Common Patterns

Ready-to-use script patterns for the most frequent gameplay scenarios. Each pattern is self-contained and can be adapted or combined as needed.

---

## Pattern 1: Player Controller

A `CharacterBody3D` that reads directional input, applies camera-relative movement, handles jumping, and tracks a simple state enum.

````tabs
--- tab: TypeScript
```typescript
import { CharacterBody3D, physicsProcess, enterTree } from "moud";
import { InputAction } from "moud/input";
import { raycast } from "moud/physics";
import { Vec3 } from "moud/math";

enum MoveState { Idle, Walking, Jumping, Falling }

export default class PlayerController extends CharacterBody3D {
  private speed      = 8;
  private jumpForce  = 9;
  private gravity    = 20;
  private state      = MoveState.Idle;

  @enterTree()
  init() {
    this.shape = "capsule";
    this.mass  = 1;
  }

  @physicsProcess()
  tick(dt: number) {
    const inp = this.getInput();
    if (!inp) return;

    // Horizontal movement relative to camera yaw
    const yaw = inp.getYaw();
    const move = inp.getVector({
      negX: InputAction.MoveLeft,
      posX: InputAction.MoveRight,
      negY: InputAction.MoveForward,
      posY: InputAction.MoveBack,
    });

    const forward = Vec3.forward(yaw);
    const right   = Vec3.right();

    const vel = this.getBodyVelocity();

    // Project horizontal intent onto world axes
    const hx = forward.x * (-move.y) + right.x * move.x;
    const hz = forward.z * (-move.y) + right.z * move.x;

    const isGrounded = this.checkGrounded();

    // Apply gravity when airborne
    const vy = isGrounded
      ? (inp.isActionJustPressed(InputAction.Jump) ? this.jumpForce : 0)
      : vel.y - this.gravity * dt;

    this.setLinearVelocity({
      x: hx * this.speed,
      y: vy,
      z: hz * this.speed,
    });

    // Update state
    if (!isGrounded) {
      this.state = vy > 0 ? MoveState.Jumping : MoveState.Falling;
    } else if (Math.abs(hx) > 0.01 || Math.abs(hz) > 0.01) {
      this.state = MoveState.Walking;
    } else {
      this.state = MoveState.Idle;
    }
  }

  private checkGrounded(): boolean {
    const hit = raycast(this.position, Vec3.down(), 1.05);
    return hit !== null;
  }
}
```

--- tab: JavaScript
```js
({
  speed: 8,
  jumpForce: 9,
  gravity: 20,
  state: "idle",   // "idle" | "walking" | "jumping" | "falling"

  _enter_tree(api) {
    this.api = api;
    api.set(api.id(), "shape", "capsule");
    api.set(api.id(), "mass",  "1");
  },

  _physics_process(api, dt) {
    var inp = api.getInput();
    if (!inp) return;

    var move = inp.get_vector("move_left", "move_right", "move_forward", "move_back");
    var yaw  = inp.getYaw() * Math.PI / 180;

    var hx = Math.cos(yaw) * move.x - Math.sin(yaw) * move.y;
    var hz = Math.sin(yaw) * move.x + Math.cos(yaw) * move.y;

    var vel = api.getBodyVelocity(api.id());
    var vy  = vel[1];

    var hit = api.raycast(
      api.getNumber("x",0), api.getNumber("y",0), api.getNumber("z",0),
      0, -1, 0, 1.05
    );
    var grounded = !!hit;

    if (grounded && inp.is_action_just_pressed("jump")) {
      vy = this.jumpForce;
    } else if (!grounded) {
      vy -= this.gravity * dt;
    } else {
      vy = 0;
    }

    api.setLinearVelocity(api.id(), hx * this.speed, vy, hz * this.speed);

    if (!grounded) {
      this.state = vy > 0 ? "jumping" : "falling";
    } else if (Math.abs(hx) > 0.01 || Math.abs(hz) > 0.01) {
      this.state = "walking";
    } else {
      this.state = "idle";
    }
  }
})
```

--- tab: Luau
```lua
local script = {
    speed = 8, jumpForce = 9, gravity = 20, state = "idle"
}

function script:_enter_tree(api)
    self.api = api
    api.set(api.id(), "shape", "capsule")
    api.set(api.id(), "mass",  "1")
end

function script:_physics_process(api, dt)
    local inp = api.getInput()
    if not inp then return end

    local move = inp.get_vector("move_left","move_right","move_forward","move_back")
    local yaw  = inp.getYaw() * math.pi / 180

    local hx = math.cos(yaw) * move.x - math.sin(yaw) * move.y
    local hz = math.sin(yaw) * move.x + math.cos(yaw) * move.y

    local vel = api.getBodyVelocity(api.id())
    local vy  = vel[2]

    local hit = api.raycast(
        api.getNumber("x",0), api.getNumber("y",0), api.getNumber("z",0),
        0, -1, 0, 1.05
    )
    local grounded = hit ~= nil

    if grounded and inp.is_action_just_pressed("jump") then
        vy = self.jumpForce
    elseif not grounded then
        vy = vy - self.gravity * dt
    else
        vy = 0
    end

    api.setLinearVelocity(api.id(), hx * self.speed, vy, hz * self.speed)

    if not grounded then
        self.state = vy > 0 and "jumping" or "falling"
    elseif math.abs(hx) > 0.01 or math.abs(hz) > 0.01 then
        self.state = "walking"
    else
        self.state = "idle"
    end
end

return script
```
````

---

## Pattern 2: Coin Collectible

An `Area3D` that awards a point when a player enters, plays a tween to float upward, fades out, then removes itself.

````tabs
--- tab: TypeScript
```typescript
import { Area3D, signal, enterTree } from "moud";
import { after } from "moud/timers";

export default class Coin extends Area3D {
  private collected = false;

  @signal("area_entered")
  onPlayerEnter(playerUuid: string) {
    if (this.collected) return;
    this.collected = true;

    // Notify a score manager (or any listener)
    this.emit("coin_collected", playerUuid);

    // Float up and fade out, then free
    this.tween({ property: "y",          to: this.y + 1.5, duration: 0.4 });
    this.tween({ property: "modulate_a", to: 0,            duration: 0.4 });

    after(0.45, () => this.free());
  }
}
```

--- tab: JavaScript
```js
({
  collected: false,

  _enter_tree(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_enter");
  },

  _on_enter(playerUuid) {
    if (this.collected) return;
    this.collected = true;

    this.api.emit_signal("coin_collected", playerUuid);

    var id  = this.api.id();
    var cur = this.api.getNumber("y", 0);
    this.api.tween(id, "y",          cur + 1.5, 0.4);
    this.api.tween(id, "modulate_a", 0,         0.4);

    var self = this;
    this.api.after(0.45, function() {
      self.api.free(id);
    });
  }
})
```

--- tab: Luau
```lua
local script = { collected = false }

function script:_enter_tree(api)
    self.api = api
    api.connect(api.id(), "area_entered", api.id(), "_on_enter")
end

function script:_on_enter(playerUuid)
    if self.collected then return end
    self.collected = true

    self.api:emit_signal("coin_collected", playerUuid)

    local id  = self.api:id()
    local cur = self.api.getNumber("y", 0)
    self.api.tween(id, "y",          cur + 1.5, 0.4)
    self.api.tween(id, "modulate_a", 0,         0.4)

    local self_ref = self
    self.api.after(0.45, function()
        self_ref.api:free(id)
    end)
end

return script
```
````

---

## Pattern 3: Door with Timer

A `Node3D` door that opens when a connected button is pressed, waits three seconds, then closes automatically using a tween sequence.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, signal, ready } from "moud";
import { after } from "moud/timers";

export default class Door extends Node3D {
  private isOpen = false;
  private openAngle  =  90;
  private closeAngle =   0;
  private tweenTime  = 0.6;
  private autoClose  = 3.0;

  @ready()
  init() {
    // The button lives elsewhere in the scene - connect programmatically
    const btn = this.find("../DoorButton");
    if (btn) {
      btn.connect({ signal: "pressed", target: this, handler: this.onButtonPressed });
    }
  }

  @signal("pressed")
  onButtonPressed() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private open() {
    this.isOpen = true;
    this.tween({ property: "ry", to: this.openAngle, duration: this.tweenTime });
    after(this.autoClose, () => {
      if (this.isOpen) this.close();
    });
  }

  private close() {
    this.tween({
      property: "ry",
      to: this.closeAngle,
      duration: this.tweenTime,
      onComplete: () => { this.isOpen = false; },
    });
  }
}
```

--- tab: JavaScript
```js
({
  isOpen: false,

  _ready(api) {
    this.api = api;
    var btn = api.find("../DoorButton");
    if (btn) {
      api.connect(btn, "pressed", api.id(), "_on_pressed");
    }
  },

  _on_pressed() {
    if (this.isOpen) {
      this._close();
    } else {
      this._open();
    }
  },

  _open() {
    this.isOpen = true;
    this.api.tween(this.api.id(), "ry", 90, 0.6);
    var self = this;
    this.api.after(3.0, function() {
      if (self.isOpen) self._close();
    });
  },

  _close() {
    this.isOpen = false;
    this.api.tween(this.api.id(), "ry", 0, 0.6);
  }
})
```

--- tab: Luau
```lua
local script = { isOpen = false }

function script:_ready(api)
    self.api = api
    local btn = api.find("../DoorButton")
    if btn then
        api.connect(btn, "pressed", api.id(), "_on_pressed")
    end
end

function script:_on_pressed()
    if self.isOpen then self:_close() else self:_open() end
end

function script:_open()
    self.isOpen = true
    self.api.tween(self.api:id(), "ry", 90, 0.6)
    local self_ref = self
    self.api.after(3.0, function()
        if self_ref.isOpen then self_ref:_close() end
    end)
end

function script:_close()
    self.isOpen = false
    self.api.tween(self.api:id(), "ry", 0, 0.6)
end

return script
```
````

---

## Pattern 4: Spawner

A `Node3D` that uses a `@process` accumulator timer to instantiate an enemy scene at regular intervals, up to a configurable cap.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, RigidBody3D, process, enterTree } from "moud";
import { instantiate, getRoot } from "moud/scene";
import { randf } from "moud/math";

export default class EnemySpawner extends Node3D {
  private interval  = 5.0;  // seconds between spawns
  private maxEnemies = 10;
  private timer     = 0;
  private spawned   = 0;

  @process()
  tick(dt: number) {
    if (this.spawned >= this.maxEnemies) return;

    this.timer += dt;
    if (this.timer < this.interval) return;
    this.timer = 0;

    this.spawnEnemy();
  }

  private spawnEnemy() {
    const root  = getRoot();
    const enemy = instantiate<RigidBody3D>("scenes/enemy.moud.scene", root);

    // Scatter within 10 units of this node
    enemy.position = {
      x: this.position.x + randf(-10, 10),
      y: this.position.y,
      z: this.position.z + randf(-10, 10),
    };

    this.spawned++;
    console.log(`Spawned enemy ${this.spawned}/${this.maxEnemies}`);
  }
}
```

--- tab: JavaScript
```js
({
  interval:   5.0,
  maxEnemies: 10,
  timer:      0,
  spawned:    0,

  _enter_tree(api) {
    this.api = api;
  },

  _process(api, dt) {
    if (this.spawned >= this.maxEnemies) return;

    this.timer += dt;
    if (this.timer < this.interval) return;
    this.timer = 0;

    var root  = api.getRootId();
    var enemy = api.instantiate("scenes/enemy.moud.scene", root);

    var ox = api.getNumber("x", 0);
    var oz = api.getNumber("z", 0);
    api.set(enemy, "x", "" + (ox + (Math.random() - 0.5) * 20));
    api.set(enemy, "z", "" + (oz + (Math.random() - 0.5) * 20));

    this.spawned++;
    api.log("Spawned enemy " + this.spawned + "/" + this.maxEnemies);
  }
})
```

--- tab: Luau
```lua
local script = { interval = 5.0, maxEnemies = 10, timer = 0, spawned = 0 }

function script:_enter_tree(api)
    self.api = api
end

function script:_process(api, dt)
    if self.spawned >= self.maxEnemies then return end

    self.timer = self.timer + dt
    if self.timer < self.interval then return end
    self.timer = 0

    local root  = api.getRootId()
    local enemy = api.instantiate("scenes/enemy.moud.scene", root)

    local ox = api.getNumber("x", 0)
    local oz = api.getNumber("z", 0)
    api.set(enemy, "x", tostring(ox + (math.random() - 0.5) * 20))
    api.set(enemy, "z", tostring(oz + (math.random() - 0.5) * 20))

    self.spawned = self.spawned + 1
    api.log("Spawned enemy " .. self.spawned .. "/" .. self.maxEnemies)
end

return script
```
````

---

## Pattern 5: HUD Score Label

A `Label` node that exposes a `score` property, initializes its text in `@ready`, and provides a `addScore` method that other nodes can call or connect to via signal.

````tabs
--- tab: TypeScript
```typescript
import { Label, ready, property } from "moud";

export default class HUDScore extends Label {
  @property score = 0;

  @ready()
  init() {
    this.text = `Score: ${this.score}`;
  }

  addScore(amount: number) {
    this.score += amount;
    this.text = `Score: ${this.score}`;
  }

  resetScore() {
    this.score = 0;
    this.text = "Score: 0";
  }
}
```

--- tab: JavaScript
```js
({
  score: 0,

  _ready(api) {
    this.api = api;
    api.set(api.id(), "text", "Score: 0");
  },

  addScore(amount) {
    this.score += amount;
    this.api.set(this.api.id(), "text", "Score: " + this.score);
  },

  resetScore() {
    this.score = 0;
    this.api.set(this.api.id(), "text", "Score: 0");
  }
})
```

--- tab: Luau
```lua
local script = { score = 0 }

function script:_ready(api)
    self.api = api
    api.set(api.id(), "text", "Score: 0")
end

function script:addScore(amount)
    self.score = self.score + amount
    self.api:set(self.api:id(), "text", "Score: " .. self.score)
end

function script:resetScore()
    self.score = 0
    self.api:set(self.api:id(), "text", "Score: 0")
end

return script
```
````

---

## Pattern 6: Multi-Player Handling

A `Node3D` authority node that uses `@process` to iterate all connected players, check a boundary condition, and teleport any who fall below the world.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process } from "moud";
import { getPlayers, teleportPlayer } from "moud/players";

export default class WorldBoundary extends Node3D {
  private killY    = -20;
  private spawnPos = { x: 0, y: 5, z: 0 };

  @process()
  tick(dt: number) {
    const players = getPlayers();

    for (const p of players) {
      if (p.y < this.killY) {
        teleportPlayer({
          uuid:     p.uuid,
          position: this.spawnPos,
          yaw:      0,
          pitch:    0,
        });
        console.log(`${p.name} fell out of the world - respawned`);
      }
    }
  }
}
```

--- tab: JavaScript
```js
({
  killY:    -20,
  spawnPos: { x: 0, y: 5, z: 0 },

  _process(api, dt) {
    var players  = api.getPlayers();
    var spawnPos = this.spawnPos;
    for (var i = 0; i < players.length; i++) {
      var p = players[i];
      if (p.y() < this.killY) {
        api.teleportPlayer(p.uuid(), spawnPos.x, spawnPos.y, spawnPos.z, 0, 0);
        api.log(p.name() + " fell out of the world - respawned");
      }
    }
  }
})
```

--- tab: Luau
```lua
local script = { killY = -20 }

function script:_process(api, dt)
    local players = api.getPlayers()
    for _, p in ipairs(players) do
        if p.y() < self.killY then
            api.teleportPlayer(p.uuid(), 0, 5, 0, 0, 0)
            api.log(p.name() .. " fell out of the world - respawned")
        end
    end
end

return script
```
````

---

## Pattern 7: Camera Orbit

A `Camera3D` that orbits the scene origin (or a target node) using `@process`. The orbit angle advances each frame; pitch and distance are configurable.

````tabs
--- tab: TypeScript
```typescript
import { Camera3D, process, enterTree } from "moud";
import { camera } from "moud/camera";

export default class OrbitCamera extends Camera3D {
  private orbitSpeed = 30;   // degrees per second
  private distance   = 15;
  private pitch      = 25;   // degrees above the horizon
  private angle      = 0;    // current yaw in degrees

  @enterTree()
  init() {
    // Make this camera the active scene camera
    camera().scene(this);
  }

  @process()
  tick(dt: number) {
    this.angle = (this.angle + this.orbitSpeed * dt) % 360;

    const rad  = this.angle  * Math.PI / 180;
    const prad = this.pitch  * Math.PI / 180;

    const camX = Math.cos(rad) * this.distance * Math.cos(prad);
    const camY = Math.sin(prad) * this.distance;
    const camZ = Math.sin(rad) * this.distance * Math.cos(prad);

    // Point toward origin from calculated orbit position
    camera().scriptable(camX, camY, camZ, this.angle + 180, -this.pitch, 0);
  }
}
```

--- tab: JavaScript
```js
({
  orbitSpeed: 30,
  distance:   15,
  pitch:      25,
  angle:      0,

  _enter_tree(api) {
    this.api = api;
    api.setSceneCurrentCamera(api.id());
  },

  _process(api, dt) {
    this.angle = (this.angle + this.orbitSpeed * dt) % 360;

    var rad  = this.angle * Math.PI / 180;
    var prad = this.pitch * Math.PI / 180;

    var camX = Math.cos(rad) * this.distance * Math.cos(prad);
    var camY = Math.sin(prad) * this.distance;
    var camZ = Math.sin(rad) * this.distance * Math.cos(prad);

    api.setScriptCamera(camX, camY, camZ, this.angle + 180, -this.pitch, 0);
  }
})
```

--- tab: Luau
```lua
local script = { orbitSpeed = 30, distance = 15, pitch = 25, angle = 0 }

function script:_enter_tree(api)
    self.api = api
    api.setSceneCurrentCamera(api.id())
end

function script:_process(api, dt)
    self.angle = (self.angle + self.orbitSpeed * dt) % 360

    local rad  = self.angle * math.pi / 180
    local prad = self.pitch * math.pi / 180

    local camX = math.cos(rad) * self.distance * math.cos(prad)
    local camY = math.sin(prad) * self.distance
    local camZ = math.sin(rad) * self.distance * math.cos(prad)

    api.setScriptCamera(camX, camY, camZ, self.angle + 180, -self.pitch, 0)
end

return script
```
````
