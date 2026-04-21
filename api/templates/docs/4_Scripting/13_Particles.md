# Particles API

The `particles` API provides server-side execution methods for `Particle3D` nodes. Operations invoked via this API are automatically replicated to all connected clients in the active scene via a reserved internal network channel.

For node property configuration (e.g., shape, motion, collision, LOD), see [Particles](/3_Features/10_Particles).

---

## API reference

All methods require a target node identifier (`nodeId`). Scripts attached directly to the `Particle3D` node can pass their own ID, while external scripts must resolve the node via `find()`.

| Method | Description |
|---|---|
| `emit(nodeId: long, count: int)` | Spawns the specified number of particles immediately. This operation respects the node's active `max_particles` limit. |
| `burst(nodeId: long)` | Executes a single emission burst. The quantity evaluates to the node's `burst_count` property, or falls back to the `rate` property if undefined. |
| `restart(nodeId: long)` | Clears all active particles, resets the internal random number generator, and restarts emission. Utilized to re-trigger `one_shot` configurations. |
| `setEmitting(nodeId: long, emitting: boolean)` | Overrides the active emission state of the node without modifying the underlying scene graph property. |
| `setRate(nodeId: long, rate: float)` | Overrides the emission rate in particles per second. This method bypasses the configuration parsing overhead associated with standard `api.set()` property mutation. |
| `setLifetime(nodeId: long, lifetime: float)` | Overrides the base particle lifespan evaluation in seconds. |
| `moveTo(nodeId: long, x: float, y: float, z: float)` | Translates the emission origin to an absolute world coordinate without modifying the underlying scene node's transform matrix. Inherited velocity evaluates against the translation delta. |
| `clearMoveTo(nodeId: long)` | Deallocates the `moveTo` override, returning the emission origin to the node's native scene transform. |

---

## Technical behavior

*   **Client-side simulation:** While API commands guarantee ordered and reliable network delivery, the particle simulation evaluates strictly client-side. Unless a fixed `seed` property is defined on the emitter, procedural randomization will diverge across different clients.
*   **Override persistence:** Runtime state overrides (`setRate`, `setLifetime`, `moveTo`, `setEmitting`) persist until the node is freed or the client terminates their connection. Execute `restart` or the respective clear methods to revert the node to its authored property state.
*   **State isolation:** Active particle counts and lifecycle evaluations are restricted to the local client renderer. The server maintains no state regarding the quantity of particles currently rendered per client.

---

## Implementation example

The following script evaluates a procedural orbit for a projectile trail, disables continuous emission upon impact, and executes a discrete impact burst.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process, enterTree } from "moud";

export default class Projectile extends Node3D {
  private trailId!: number;
  private impactId!: number;
  private t = 0;

  @enterTree()
  init() {
    this.trailId = this.find("Trail");
    this.impactId = this.find("Impact");
    this.particles.setRate(this.trailId, 120);
  }

  @process()
  tick(dt: number) {
    this.t += dt;
    const x = Math.cos(this.t * 2) * 5;
    const y = 3 + Math.sin(this.t * 4);
    const z = Math.sin(this.t * 2) * 5;
    
    this.particles.moveTo(this.trailId, x, y, z);
  }

  onImpact() {
    this.particles.setEmitting(this.trailId, false);
    this.particles.burst(this.impactId);
  }
}
```

--- tab: Luau
```lua
local script = {}

function script._ready(self, api)
    self.trailId = api:find("Trail")
    self.impactId = api:find("Impact")
    self.t = 0
    api:particles():setRate(self.trailId, 120)
end

function script._process(self, api, dt)
    self.t = self.t + dt
    local x = math.cos(self.t * 2) * 5
    local y = 3 + math.sin(self.t * 4)
    local z = math.sin(self.t * 2) * 5
    
    api:particles():moveTo(self.trailId, x, y, z)
end

function script.onImpact(self, api)
    api:particles():setEmitting(self.trailId, false)
    api:particles():burst(self.impactId)
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Projectile extends NodeScript {
    long trailId;
    long impactId;
    double t = 0;

    @Override public void onReady() {
        trailId = core.find("Trail");
        impactId = core.find("Impact");
        particles.setRate(trailId, 120);
    }

    @Override public void onProcess(double dt) {
        t += dt;
        double x = Math.cos(t * 2) * 5;
        double y = 3 + Math.sin(t * 4);
        double z = Math.sin(t * 2) * 5;
        
        particles.moveTo(trailId, x, y, z);
    }

    public void onImpact() {
        particles.setEmitting(trailId, false);
        particles.burst(impactId);
    }
}
```
````