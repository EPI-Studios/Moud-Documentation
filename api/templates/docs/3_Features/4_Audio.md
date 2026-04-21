**Audio**

Audio playback in Moud is handled through dedicated nodes in the scene tree. The engine provides two classes for audio playback: `AudioPlayer2D` for non-positional audio and `AudioPlayer3D` for spatialized audio. All audio state is simulated on the server and replicated to connected clients for local playback.

![AudioPlayer3D node in the inspector with 3D spatial settings and a sound file assigned](placeholder)

---

## Client-server runtime

The audio system relies on Moud's property replication system. There is no dedicated client-side audio API; all audio is controlled by server logic.

1. A server script updates an audio node's property (e.g., `playing`, `sound_id`).
2. The server replicates this change to connected clients via `SceneOpBatch`.
3. The client's `SceneAudioManager` reads the property and updates the local audio stream.

---

## Node classes

### AudioPlayer2D
`AudioPlayer2D` emits non-positional audio. Volume and panning remain constant regardless of the listener's camera or character position. This node is typically used for UI sound effects, background music, and global announcements.

### AudioPlayer3D
`AudioPlayer3D` emits spatialized audio. The client attenuates the volume based on the distance between the listener and the node's 3D coordinates. This node is used for environmental ambience, physical impacts, and character-emitted sounds.

---

## Properties

Both audio nodes inherit the following properties:

| Property | Type | Default | Description |
|---|---|---|---|
| `sound_id` | string | `""` | The absolute asset path (e.g., `res://audio/sfx/explosion.ogg`). |
| `playing` | bool | `false` | Determines whether the audio stream is currently active. |
| `loop` | bool | `false` | If `true`, the audio stream restarts automatically upon completion. |
| `volume_db` | float | `0.0` | Volume offset in decibels. `0.0` represents the asset's original volume. `-inf` mutes the stream. |
| `pitch_scale` | float | `1.0` | Multiplier for audio playback speed and pitch. A value of `0.5` shifts the audio down one octave; `2.0` shifts it up one octave. |
| `category` | string | `"master"` | Target audio bus for mixing (`"master"`, `"music"`, `"sfx"`, `"ambient"`, `"ui"`). |

`AudioPlayer3D` includes additional spatial properties:

| Property | Type | Default | Description |
|---|---|---|---|
| `max_distance` | float | `40.0` | The maximum distance at which the audio is audible. Beyond this radius, the stream is muted. |
| `attenuation` | float | `1.0` | The falloff curve exponent governing volume reduction over distance (`1.0` = linear, `2.0` = quadratic). |

---

## Scripting

### Playback state

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";

export default class AudioStarter extends Node3D {
  @ready()
  onReady() {
    this.set("sound_id", "res://audio/sfx/spawn.ogg");
    this.set("playing", "true");
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    api.set("sound_id", "res://audio/sfx/spawn.ogg");
    api.set("playing", "true");
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  api:set("sound_id", "res://audio/sfx/spawn.ogg")
  api:set("playing", "true")
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class AudioStarter extends NodeScript {
    @Override public void onReady() {
        core.set(core.id(), "sound_id", "res://audio/sfx/spawn.ogg");
        core.set(core.id(), "playing", "true");
    }
}
```
````

### Configuring loops and categories

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";

export default class MusicPlayer extends Node3D {
  @ready()
  onReady() {
    this.set("sound_id", "res://audio/music/theme.ogg");
    this.set("loop", "true");
    this.set("category", "music");
    this.set("volume_db", "-6");
    this.set("playing", "true");
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    api.set("sound_id", "res://audio/music/theme.ogg");
    api.set("loop", "true");
    api.set("category", "music");
    api.set("volume_db", "-6");
    api.set("playing", "true");
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  api:set("sound_id", "res://audio/music/theme.ogg")
  api:set("loop", "true")
  api:set("category", "music")
  api:set("volume_db", "-6")
  api:set("playing", "true")
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class MusicPlayer extends NodeScript {
    @Override public void onReady() {
        long id = core.id();
        core.set(id, "sound_id", "res://audio/music/theme.ogg");
        core.set(id, "loop", "true");
        core.set(id, "category", "music");
        core.set(id, "volume_db", "-6");
        core.set(id, "playing", "true");
    }
}
```
````

### Stopping playback

````tabs
--- tab: TypeScript
```typescript
this.set("playing", "false");
```

--- tab: JavaScript
```js
api.set("playing", "false");
```

--- tab: Luau
```lua
api:set("playing", "false")
```

--- tab: Java
```java
core.set(core.id(), "playing", "false");
```
````

### Dynamic volume modification

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process } from "moud";

export default class MusicFader extends Node3D {
  fadeTimer = 0;
  FADE_DURATION = 3.0;

  startFade() {
    this.fadeTimer = this.FADE_DURATION;
  }

  @process()
  onProcess(dt: number) {
    if (this.fadeTimer <= 0) return;

    this.fadeTimer = Math.max(0, this.fadeTimer - dt);
    const t = this.fadeTimer / this.FADE_DURATION;
    const db = (t - 1) * 40;
    this.set("volume_db", String(db));

    if (this.fadeTimer === 0) {
      this.set("playing", "false");
    }
  }
}
```

--- tab: JavaScript
```js
({
  fadeTimer: 0,
  FADE_DURATION: 3.0,

  startFade() {
    this.fadeTimer = this.FADE_DURATION;
  },

  _process(api, dt) {
    if (this.fadeTimer <= 0) return;
    this.fadeTimer = Math.max(0, this.fadeTimer - dt);
    const t = this.fadeTimer / this.FADE_DURATION;
    const db = (t - 1) * 40;
    api.set("volume_db", String(db));
    if (this.fadeTimer === 0) api.set("playing", "false");
  }
})
```

--- tab: Luau
```lua
local script = {}
script.fadeTimer = 0
script.FADE_DURATION = 3.0

function script:startFade()
  self.fadeTimer = self.FADE_DURATION
end

function script:_process(api, dt)
  if self.fadeTimer <= 0 then return end
  self.fadeTimer = math.max(0, self.fadeTimer - dt)
  local t = self.fadeTimer / self.FADE_DURATION
  local db = (t - 1) * 40
  api:set("volume_db", tostring(db))
  if self.fadeTimer == 0 then
    api:set("playing", "false")
  end
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class MusicFader extends NodeScript {
    private double fadeTimer = 0;
    private static final double FADE_DURATION = 3.0;

    public void startFade() {
        this.fadeTimer = FADE_DURATION;
    }

    @Override public void onProcess(double dt) {
        if (fadeTimer <= 0) return;
        fadeTimer = Math.max(0, fadeTimer - dt);
        double t = fadeTimer / FADE_DURATION;
        double db = (t - 1) * 40;
        core.set(core.id(), "volume_db", String.valueOf(db));
        if (fadeTimer == 0) {
            core.set(core.id(), "playing", "false");
        }
    }
}
```
````

---

## Implementation examples

### Input-driven audio

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process } from "moud";

export default class FootstepPlayer extends Node3D {
  stepTimer = 0;
  STEP_INTERVAL = 0.45;

  @process()
  onProcess(dt: number) {
    const inp = this.getInput();
    const mx = inp.getAxis(InputAction.MoveLeft, InputAction.MoveRight);
    const mz = inp.getAxis(InputAction.MoveBack, InputAction.MoveForward);
    const moving = Math.abs(mx) > 0.1 || Math.abs(mz) > 0.1;

    if (!moving) {
      this.stepTimer = 0;
      return;
    }

    this.stepTimer += dt;
    if (this.stepTimer >= this.STEP_INTERVAL) {
      this.stepTimer = 0;
      this.set("pitch_scale", String(0.9 + Math.random() * 0.2));
      this.set("playing", "false");
      this.set("playing", "true");
    }
  }
}
```

--- tab: JavaScript
```js
({
  stepTimer: 0,
  STEP_INTERVAL: 0.45,

  _process(api, dt) {
    const inp = api.getInput();
    const mx = inp.get_axis("move_left", "move_right");
    const mz = inp.get_axis("move_back", "move_forward");
    const moving = Math.abs(mx) > 0.1 || Math.abs(mz) > 0.1;
    if (!moving) { this.stepTimer = 0; return; }
    this.stepTimer += dt;
    if (this.stepTimer >= this.STEP_INTERVAL) {
      this.stepTimer = 0;
      api.set("pitch_scale", String(0.9 + Math.random() * 0.2));
      api.set("playing", "false");
      api.set("playing", "true");
    }
  }
})
```

--- tab: Luau
```lua
local script = {}
script.stepTimer = 0
script.STEP_INTERVAL = 0.45

function script:_process(api, dt)
  local inp = api:getInput()
  local mx = inp:get_axis("move_left", "move_right")
  local mz = inp:get_axis("move_back", "move_forward")
  local moving = math.abs(mx) > 0.1 or math.abs(mz) > 0.1
  if not moving then
    self.stepTimer = 0
    return
  end
  self.stepTimer = self.stepTimer + dt
  if self.stepTimer >= self.STEP_INTERVAL then
    self.stepTimer = 0
    api:set("pitch_scale", tostring(0.9 + math.random() * 0.2))
    api:set("playing", "false")
    api:set("playing", "true")
  end
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;
import com.moud.server.minestom.scripting.player.InputEvent;

public final class FootstepPlayer extends NodeScript {
    private double stepTimer = 0;
    private static final double STEP_INTERVAL = 0.45;

    @Override public void onProcess(double dt) {
        InputEvent inp = core.getInput();
        double mx = inp.getAxis("move_left", "move_right");
        double mz = inp.getAxis("move_back", "move_forward");
        boolean moving = Math.abs(mx) > 0.1 || Math.abs(mz) > 0.1;
        if (!moving) { stepTimer = 0; return; }
        stepTimer += dt;
        if (stepTimer >= STEP_INTERVAL) {
            stepTimer = 0;
            long id = core.id();
            core.set(id, "pitch_scale", String.valueOf(0.9 + Math.random() * 0.2));
            core.set(id, "playing", "false");
            core.set(id, "playing", "true");
        }
    }
}
```
````

### Audio crossfading

To crossfade between tracks, modify the `volume_db` of two active `AudioPlayer2D` nodes simultaneously.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process } from "moud";

export default class MusicCrossfader extends Node3D {
  fadingIn: number | null = null;
  fadingOut: number | null = null;
  fadeProgress = 0;
  FADE_TIME = 2.0;

  crossfadeTo(targetTrack: string) {
    const a = this.find("MusicA");
    const b = this.find("MusicB");

    this.set(b, "sound_id", targetTrack);
    this.set(b, "volume_db", "-40");
    this.set(b, "loop", "true");
    this.set(b, "playing", "true");

    this.fadingIn = b;
    this.fadingOut = a;
    this.fadeProgress = 0;
  }

  @process()
  onProcess(dt: number) {
    if (this.fadingIn === null) return;
    this.fadeProgress = Math.min(1, this.fadeProgress + dt / this.FADE_TIME);

    this.set(this.fadingIn,  "volume_db", String(-40 * (1 - this.fadeProgress)));
    this.set(this.fadingOut, "volume_db", String(-40 * this.fadeProgress));

    if (this.fadeProgress >= 1) {
      this.set(this.fadingOut, "playing", "false");
      this.fadingIn = null;
      this.fadingOut = null;
    }
  }
}
```

--- tab: JavaScript
```js
({
  fadingIn: null,
  fadingOut: null,
  fadeProgress: 0,
  FADE_TIME: 2.0,

  crossfadeTo(api, targetTrack) {
    const a = api.find("MusicA");
    const b = api.find("MusicB");
    api.set(b, "sound_id", targetTrack);
    api.set(b, "volume_db", "-40");
    api.set(b, "loop", "true");
    api.set(b, "playing", "true");
    this.fadingIn = b;
    this.fadingOut = a;
    this.fadeProgress = 0;
  },

  _process(api, dt) {
    if (this.fadingIn === null) return;
    this.fadeProgress = Math.min(1, this.fadeProgress + dt / this.FADE_TIME);
    api.set(this.fadingIn,  "volume_db", String(-40 * (1 - this.fadeProgress)));
    api.set(this.fadingOut, "volume_db", String(-40 * this.fadeProgress));
    if (this.fadeProgress >= 1) {
      api.set(this.fadingOut, "playing", "false");
      this.fadingIn = this.fadingOut = null;
    }
  }
})
```

--- tab: Luau
```lua
local script = {}
script.fadingIn = nil
script.fadingOut = nil
script.fadeProgress = 0
script.FADE_TIME = 2.0

function script:crossfadeTo(api, targetTrack)
  local a = api:find("MusicA")
  local b = api:find("MusicB")
  api:set(b, "sound_id", targetTrack)
  api:set(b, "volume_db", "-40")
  api:set(b, "loop", "true")
  api:set(b, "playing", "true")
  self.fadingIn = b
  self.fadingOut = a
  self.fadeProgress = 0
end

function script:_process(api, dt)
  if self.fadingIn == nil then return end
  self.fadeProgress = math.min(1, self.fadeProgress + dt / self.FADE_TIME)
  api:set(self.fadingIn,  "volume_db", tostring(-40 * (1 - self.fadeProgress)))
  api:set(self.fadingOut, "volume_db", tostring(-40 * self.fadeProgress))
  if self.fadeProgress >= 1 then
    api:set(self.fadingOut, "playing", "false")
    self.fadingIn = nil
    self.fadingOut = nil
  end
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class MusicCrossfader extends NodeScript {
    private Long fadingIn = null;
    private Long fadingOut = null;
    private double fadeProgress = 0;
    private static final double FADE_TIME = 2.0;

    public void crossfadeTo(String targetTrack) {
        long a = core.find("MusicA");
        long b = core.find("MusicB");
        core.set(b, "sound_id", targetTrack);
        core.set(b, "volume_db", "-40");
        core.set(b, "loop", "true");
        core.set(b, "playing", "true");
        fadingIn = b;
        fadingOut = a;
        fadeProgress = 0;
    }

    @Override public void onProcess(double dt) {
        if (fadingIn == null) return;
        fadeProgress = Math.min(1, fadeProgress + dt / FADE_TIME);
        core.set(fadingIn,  "volume_db", String.valueOf(-40 * (1 - fadeProgress)));
        core.set(fadingOut, "volume_db", String.valueOf(-40 * fadeProgress));
        if (fadeProgress >= 1) {
            core.set(fadingOut, "playing", "false");
            fadingIn = null;
            fadingOut = null;
        }
    }
}
```
````

---

## 3D Spatial Audio

`AudioPlayer3D` automatically attenuates volume based on distance from the client listener.

| Distance to AudioPlayer3D | Output Volume |
|---|---|
| `0.0` | 100% of `volume_db` |
| 50% of `max_distance` | 50% attenuation |
| `max_distance` | Silent |

### Initialization

```json
{
  "type": "AudioPlayer3D",
  "properties": {
    "x": "10", "y": "0", "z": "5",
    "sound_id": "res://audio/ambient/waterfall.ogg",
    "loop": "true",
    "playing": "true",
    "max_distance": "25",
    "volume_db": "3"
  }
}
```

```hint tip 3D Audio Distance Tuning
When configuring large environmental sources (e.g., waterfalls, fire), assign a `max_distance` of 50–100 and a `volume_db` of 3–6. For localized sources (e.g., insects, drips), limit `max_distance` to 5–10.
```

---

## Audio routing

The `category` property assigns the node to a specific audio bus for grouped mixing.

| Category | Description |
|---|---|
| `master` | Default output bus. All audio routes through this bus. |
| `music` | Assigned to continuous background tracks. |
| `sfx` | Assigned to immediate gameplay audio. |
| `ambient` | Assigned to environmental loops (e.g., wind, water). |
| `ui` | Assigned to non-spatial interface interactions. |

```hint info Planned features
A global volume control API (`api.setAudioCategoryVolume("music", 0.8)`) and per-player volume settings are planned for a future release. Currently, audio is mixed uniformly across all clients.
```

---

## Supported formats

| Format | Extension | Notes |
|---|---|---|
| OGG Vorbis | `.ogg` | Recommended format. Optimal compression ratio and sample-accurate loop points. |
| WAV | `.wav` | Uncompressed format. Yields large file sizes; limit usage to critical, short samples. |
| MP3 | `.mp3` | Supported, but generally discouraged for loops. |

```hint warning OGG for Looping
Use OGG Vorbis for looping audio. MP3 encoding introduces encoder padding, which results in audible gaps at the loop point.
```

---
