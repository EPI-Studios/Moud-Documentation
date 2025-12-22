# Audio & Voice

Moud has **two** audio-related systems that often get mixed up:

1. **Audio playback**: the server tells the client “play this sound”, “fade it out”, “move it”, etc.
2. **Voice**: a real voice chat pipeline (routing, proximity range, channels, recordings…) built on Moud packets.

And there’s a third thing that looks like voice, but is actually lower-level:

3. **Microphone capture**: “give me raw PCM chunks from the client’s mic” so you can do your own thing (moderation, custom radio, analysis, etc.).

This page explains the three.

---

## 1) Audio playback (sounds)

### The model

- Every sound is addressed by an `id` **per player**.
- You `play({ id, ... })` once, then `update({ id, ... })` as many times as you want, then `stop({ id })`.
- The client has a **managed sound limit** (64). If you spam unique ids, new sounds will get refused.

### Example : play / update / stop

```ts
const audio = player.getAudio();

audio.play({
  id: 'music:intro',
  sound: 'minecraft:music.menu',
  category: 'music',
  volume: 0.6,
  loop: true,
  fadeInMs: 1500,
  crossFadeGroup: 'music',
  crossFadeMs: 1500
});

// later…
audio.update({
  id: 'music:intro',
  volume: 0.25,
  pitchRamp: { pitch: 1.1, durationMs: 1200, easing: 'ease_in_out' }
});

// mater…
audio.stop({ id: 'music:intro', fadeOutMs: 800 });
```

If a sound doesn’t play, the first thing to check is: “is that sound id present in the client’s current resource pack?”

---

## 2) Sounds effects (crossfades, ducking, spatial audio)

### Crossfading a music playlist (no overlap chaos)

You don’t want “battle music” + “exploration music” fighting each other. Use a crossfade group:

```ts
function playTrack(player: Player, track: string) {
  player.getAudio().play({
    id: `music:${track}`,
    sound: `moud:music/${track}`,
    category: 'music',
    loop: true,
    volume: 0.5,
    crossFadeGroup: 'music',
    crossFadeMs: 2500
  });
}
```

Calling `playTrack(player, 'battle')` automatically fades out any previous sound in group `music`.

### Ducking 

Ducking is “lower group X while this sound is active”.

```ts
player.getAudio().play({
  id: 'ui:notification',
  sound: 'minecraft:entity.experience_orb.pickup',
  volume: 0.9,
  duck: { group: 'music', amount: 0.6, attackMs: 80, releaseMs: 400 },
  mixGroup: 'sfx'
});
```

Here, when the notification plays, it temporarily reduces the mix group `music` by `amount` (0 → no duck, 1 → full duck).

### Positional audio (3D)

```ts
player.getAudio().play({
  id: 'orb:hum',
  sound: 'minecraft:block.beacon.ambient',
  category: 'ambient',
  volume: 0.7,
  loop: true,
  positional: true,
  position: api.math.vector3(12, 65, 8),
  minDistance: 2,
  maxDistance: 32,
  distanceModel: 'inverse',
  rolloff: 1.0
});
```

To “attach” a sound to something that moves, just update its `position`:

```ts
player.getAudio().update({
  id: 'orb:hum',
  position: api.math.vector3(12, 65, 9)
});
```

---

## Microphone capture 

This is **not** the same as voice chat. It’s a low-level capture stream.

### Start / stop capture

```ts
player.getAudio().startMicrophone({
  sessionId: `mic:test:${player.getUuid()}`,
  sampleRate: 48000,
  frameSizeMs: 20
});

// later
player.getAudio().stopMicrophone();
```

### Reading the session state

```ts
const session = player.getAudio().getMicrophoneSession();
if (!session) return;

if (session.active) {
  // `chunkBase64` is present when legacy mic events are enabled (or when the client is using the legacy path)
  // It is not a full audio history; it’s just the last observed chunk.
  console.log('mic active', session.sessionId, session.sampleRate, session.channels);
}
```

### When to use `legacyScriptEvents`

Moud has two mic paths:

- **Modern path (preferred)**: the client processes and ships voice frames through the voice pipeline.
- **Legacy script events**: the mic sends `audio:microphone:*` events (chunk/state/error) to the server as JSON.

If you explicitly want those `audio:microphone:*` script events, enable:

```ts
player.getAudio().startMicrophone({ legacyScriptEvents: true });
```

---

##  Voice chat (routing + state + recording)

Voice chat is built around **routing**. You don’t “play sounds”; you describe who hears whom, and the runtime handles packets.

### Routing modes (what they mean)

- `proximity`: hear players within `range` (positional by default)
- `channel`: hear players on the same named channel
- `radio`: like channel, but typically paired with different processing/range rules in your gameplay
- `direct`: explicit `targets` list (useful for party chat, whisper to an NPC, etc.)

### Set default proximity voice

```ts
player.getAudio().setVoiceRouting({
  mode: 'proximity',
  range: 16,
  positional: true,
  speechMode: 'normal'
});
```

### Party chat (direct targets)

```ts
player.getAudio().setVoiceRouting({
  mode: 'direct',
  targets: [
    leader.getUuid().toString(),
    teammate.getUuid().toString()
  ],
  positional: false
});
```

### Inspect voice state (is someone speaking?)

```ts
const voice = player.getAudio().getVoiceState();
if (voice?.active && voice.speaking) {
  console.log('speaking with level', voice.level, 'session', voice.sessionId);
}
```

### Recording & replay 

```ts
const recordingId = player.getAudio().startVoiceRecording({ maxDurationMs: 30_000 });
// ... later
player.getAudio().stopVoiceRecording();

// Replay to nearby players
player.getAudio().replayVoiceRecording(recordingId!, {
  range: 12,
  position: player.getPosition(),
  replayId: 'replay:test'
});
```

---

## Full reference: `SoundPlayOptions`

Use this when you need “every knob”.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Required. Unique per player. |
| `sound` | `string` | Namespaced sound id. Must exist in the client’s resources. |
| `category` | `SoundCategory` | Defaults to `master`. |
| `volume` | `number` | Default `1.0`. |
| `pitch` | `number` | Default `1.0`. |
| `loop` | `boolean` | Default `false`. |
| `startDelayMs` | `number` | Delay before starting playback. |
| `fadeInMs` / `fadeOutMs` | `number` | Envelope times. |
| `fadeInEasing` / `fadeOutEasing` | `linear \| ease_in \| ease_out \| ease_in_out` | Easing curve for fades. |
| `positional` | `boolean` | Enables 3D attenuation/panning. |
| `position` | `Vector3 \| [x,y,z]` | Required for moving 3D sources. |
| `minDistance` / `maxDistance` | `number` | Controls attenuation curve range. |
| `distanceModel` | `linear \| inverse \| exponential` | How distance affects volume. |
| `rolloff` | `number` | Extra attenuation multiplier (engine-specific feel). |
| `pitchRamp` | `{ pitch, durationMs, easing? }` | Smooth pitch glide. |
| `volumeLfo` | `{ frequencyHz, depth, waveform? }` | Tremolo-style modulation. `depth` is 0..1. |
| `pitchLfo` | `{ frequencyHz, depthSemitones, waveform? }` | Vibrato-style modulation. |
| `mixGroup` | `string` | Lets you group sounds for ducking/mix control. |
| `duck` | `{ group, amount, attackMs?, releaseMs? }` | Duck another mix group while this plays. |
| `crossFadeGroup` | `string` | Fade out older members automatically. |
| `crossFadeMs` | `number` | Crossfade duration. |

