## Pattern: Authority Node

Use a single node to manage global game state - score, match flow, timers. Other nodes emit signals; the authority node listens and keeps the source of truth.

````tabs
--- tab: JavaScript
```js
// game_manager.js - the authority
({
  score: 0,
  gameOver: false,

  _ready(api) {
    this.api = api;

    // Listen to all collectibles
    var orbs = api.findNodesByType("Area3D");
    for (var i = 0; i < orbs.length; i++) {
      api.connect(orbs[i], "orb_collected", api.id(), "_on_orb");
    }
  },

  _on_orb() {
    if (this.gameOver) return;
    this.score++;
    this.api.log("Score: " + this.score);

    // Update the score label
    var label = this.api.find("ScoreLabel");
    if (label) {
      this.api.set(label, "text", "Score: " + this.score);
    }

    // Win condition
    if (this.score >= 10) {
      this.gameOver = true;
      this.api.log("You win!");
    }
  }
})
```

--- tab: Luau
```lua
local script = { score = 0, gameOver = false }

function script:_ready(api)
    self.api = api
    local orbs = api.findNodesByType("Area3D")
    for _, id in ipairs(orbs) do
        api.connect(id, "orb_collected", api.id(), "_on_orb")
    end
end

function script:_on_orb()
    if self.gameOver then return end
    self.score = self.score + 1
    local label = self.api:find("ScoreLabel")
    if label then
        self.api:set(label, "text", "Score: " .. self.score)
    end
end

return script
```
````

## Pattern: Runtime Spawning

Create objects during gameplay that don't exist in the initial scene.

````tabs
--- tab: JavaScript
```js
({
  count: 0,

  spawnProjectile(api, x, y, z, vx, vy, vz) {
    this.count++;
    var bullet = api.createRuntime(0, "Bullet_" + this.count, "RigidBody3D");
    api.set(bullet, "x", "" + x);
    api.set(bullet, "y", "" + y);
    api.set(bullet, "z", "" + z);
    api.set(bullet, "shape", "sphere");
    api.set(bullet, "mass", "0.1");
    api.set(bullet, "sx", "0.2");
    api.set(bullet, "sy", "0.2");
    api.set(bullet, "sz", "0.2");
    api.setLinearVelocity(bullet, vx, vy, vz);

    // Destroy after 5 seconds
    api.after(5.0, function() {
      if (api.exists(bullet)) {
        api.free(bullet);
      }
    });

    return bullet;
  }
})
```

--- tab: Luau
```lua
local script = { count = 0 }

function script:spawnProjectile(api, x, y, z, vx, vy, vz)
    self.count = self.count + 1
    local bullet = api.createRuntime(0, "Bullet_" .. self.count, "RigidBody3D")
    api.set(bullet, "x", tostring(x))
    api.set(bullet, "y", tostring(y))
    api.set(bullet, "z", tostring(z))
    api.set(bullet, "shape", "sphere")
    api.set(bullet, "mass", "0.1")
    api.setLinearVelocity(bullet, vx, vy, vz)

    api.after(5.0, function()
        if api.exists(bullet) then
            api.free(bullet)
        end
    end)
end

return script
```
````

## Pattern: Bobbing and Spinning

Animate an object to draw attention. Use in collectibles, floating markers, indicators.

```js
_physics_process(api, dt) {
  this.t += dt;

  // Bob up and down
  var y = this.baseY + Math.sin(this.t * 3) * 0.3;
  api.setNumber("y", y);

  // Spin
  var ry = api.getNumber("ry", 0) + 90 * dt;
  api.setNumber("ry", ry);
}
```

## Pattern: Timed Sequence

Chain timers for step-by-step gameplay events.

```js
_ready(api) {
  api.log("Get ready...");

  api.after(1.0, function() {
    api.log("3...");
    api.after(1.0, function() {
      api.log("2...");
      api.after(1.0, function() {
        api.log("1...");
        api.after(1.0, function() {
          api.log("GO!");
          // Start the game
        });
      });
    });
  });
}
```

## Pattern: Property-Driven State

Store gameplay state on node properties so it's visible in the editor and accessible from other scripts.

```js
// Store state on properties
api.set("state", "idle");      // "idle", "chasing", "attacking"
api.setNumber("health", 100);
api.set("team", "red");

// Read state from another script
var state = api.get(enemyId, "state");
var health = api.getNumber(enemyId, "health", 0);
```

## Pattern: Multi-Player Handling

Handle multiple players by iterating `api.getPlayers()`:

````tabs
--- tab: JavaScript
```js
_process(api, dt) {
  var players = api.getPlayers();
  for (var i = 0; i < players.length; i++) {
    var p = players[i];
    // Check if player is inside a boundary
    if (p.y() < -10) {
      api.teleportPlayer(p.uuid(), 0, 10, 0);
      api.log(p.name() + " fell off the map!");
    }
  }
}
```

--- tab: Luau
```lua
function script:_process(api, dt)
    local players = api.getPlayers()
    for _, p in ipairs(players) do
        if p.y() < -10 then
            api.teleportPlayer(p.uuid(), 0, 10, 0)
            api.log(p.name() .. " fell off the map!")
        end
    end
end
```
````

## Pattern: Smooth Movement with Tweens

Use tweens for polish - doors, platforms, UI animations.

```js
// Open a door
api.tween(doorId, "ry", 90, 0.5);

// Move a platform
api.tween(platformId, "y", 10, 2.0);

// Fade in a UI panel
api.tween(panelId, "modulate_a", 1, 0.3);
```
