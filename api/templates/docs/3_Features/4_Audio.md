# Audio System

Moud plays audio through dedicated audio nodes in the scene tree. There are two types: `AudioPlayer2D` for non-positional sound and `AudioPlayer3D` for spatialized 3D audio
## Audio Node Types

### AudioPlayer2D

Plays non-positional audio. The sound is the same volume regardless of where the listener is.
### AudioPlayer3D

Plays positional audio. The sound gets louder as the listener gets closer and quieter as they move away. 

## Properties

Both audio nodes share these properties:

| Property | Type | Description |
|---|---|---|
| `sound_id` | string | Asset path to the audio file (e.g. `res://audio/explosion.ogg`) |
| `playing` | bool | Whether the sound is currently playing |
| `loop` | bool | Loop the sound when it ends |
| `volume_db` | float | Volume in decibels (0 = normal, negative = quieter) |
| `pitch_scale` | float | Playback speed/pitch multiplier (1.0 = normal) |
| `category` | string | Audio category for mixing (e.g. `"master"`, `"music"`, `"sfx"`, `"ambient"`) |

## Scripting Audio

Control audio playback from scripts by setting properties:

````tabs
--- tab: JavaScript
```js
({
  _ready(api) {
    // find an audio player and start it
    var music = api.find("BackgroundMusic");
    api.set(music, "playing", "true");
  },

  _on_collected() {
    // play a one-shot sound effect
    var sfx = api.find("CollectSound");
    api.set(sfx, "playing", "true");
  },

  // fade out music over time
  _process(api, dt) {
    var music = api.find("BackgroundMusic");
    var vol = api.getNumber(music, "volume_db", 0);
    if (vol > -40) {
      api.setNumber(music, "volume_db", vol - dt * 5);
    }
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_ready(api)
    local music = api.find("BackgroundMusic")
    api.set(music, "playing", "true")
end

function script:_on_collected()
    local sfx = api.find("CollectSound")
    api.set(sfx, "playing", "true")
end

return script
```
````