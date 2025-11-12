# Audio & Voice

Moud’s audio stack goes far beyond `/playsound`. The server exposes a fluent API (`player.audio`) for positional sounds, layered music, fades, cross-fades, pitch ramps, and even microphone streaming back to the server. The Fabric mod hosts a `ClientAudioService` that manages up to 64 concurrent sounds per player with sample-accurate fades.

## Playback API

```ts
const audio = player.getAudio(); // or player.audio

audio.play({
  id: 'intro_theme',
  sound: 'minecraft:music.menu',
  category: 'music',
  volume: 0.6,
  loop: true,
  fadeInMs: 2000,
  crossFadeGroup: 'music',
  crossFadeMs: 1500
});
```

Every sound is addressed by an `id`. Later `update` or `stop` calls reference the same id.

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Required. Unique per-player. |
| `sound` | Namespaced id | Any registered sound event (`minecraft:music.game`, custom datapacks, etc.). |
| `category` | string (SoundCategory) | Defaults to `MASTER`. |
| `volume` / `pitch` | number | Defaults 1.0. |
| `loop` | boolean | Whether the sound restarts automatically. |
| `fadeInMs` / `fadeOutMs` | number | Milliseconds for envelope transitions. |
| `positional` | boolean | If `true`, treat as spatialised sound. Requires `position`. |
| `position` | `{ x, y, z }` | World-space coordinates for positional audio. |
| `maxDistance` | number | Cut-off distance for positional attenuation. |
| `pitchRamp` | `{ pitch, durationMs, easing }` | Smoothly glide to a new pitch. |
| `crossFadeGroup` | string | Tag multiple sounds so the engine automatically fades out previous members when a new one starts. |
| `crossFadeMs` | number | Duration of the cross-fade. |

Updating an existing sound:

```ts
audio.update({
  id: 'intro_theme',
  volume: 0.3,
  pitchRamp: { pitch: 1.2, durationMs: 4000, easing: 'ease_in_out' }
});
```

Stopping:

```ts
audio.stop({ id: 'intro_theme', fadeOutMs: 1000 });
```

If you omit `fadeOutMs`, the sound stops immediately.

## Layering & Groups

Cross-fade groups ensure one category of audio never clashes with itself:

```ts
function playTrack(player: Player, trackId: string) {
  player.audio.play({
    id: `music:${trackId}`,
    sound: `moud:music/${trackId}`,
    category: 'music',
    volume: 0.5,
    loop: true,
    crossFadeGroup: 'music',
    crossFadeMs: 2500
  });
}
```

Triggering `playTrack(player, 'battle')` will fade out the previous group member (`music:intro`, for example) over 2.5 seconds before fading in the new one.

## Positional Sound Effects

```ts
player.audio.play({
  id: `orb_${player.getUuid()}`,
  sound: 'minecraft:block.beacon.activate',
  category: 'ambient',
  volume: 0.7,
  positional: true,
  position: api.math.vector3(12, 65, 8),
  maxDistance: 32
});
```

Updating the `position` field lets you attach the sound to moving entities or cursor targets.

## Microphone Streaming

You can request microphone access from the client and consume PCM chunks on the server via `ServerMicrophoneManager`.

```ts
// server
player.audio.startMicrophone({
  sessionId: `team_chat_${player.getUuid()}`,
  sampleRate: 48000
});
```

To stop:

```ts
player.audio.stopMicrophone();
```

Server-side you can inspect sessions:

```ts
const session = player.audio.getMicrophoneSession();
if (session?.state === 'started') {
  // still not fully implemented
}
```

`ServerMicrophoneManager` keeps track of active sessions and exposes raw PCM buffers so you can relay them to another service (voice chat, recording, moderation, etc.).

