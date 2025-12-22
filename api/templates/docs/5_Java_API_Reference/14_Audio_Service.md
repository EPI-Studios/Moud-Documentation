# Audio Service

`AudioService` is the Java plugin entry point for **client-side sound playback**.

If you can describe a sound as “play/update/stop with an id”, it belongs here.
It does **not** control voice chat routing (that’s `VoiceService`) and it does **not** start microphone capture (that’s `MicrophoneService`).

```hint warn You SHOULD have the MOD
Works only for players using the Moud client mod. The server silently ignores audio commands for non-Moud clients
``` 

## The model

- Every sound has an `id` **per player**.
- `play()` registers it, `update()` modifies it, `stop()` ends it.
- Use stable ids (`music:intro`, `ui:click`, `npc:42:hum`) instead of random ids.

## Minimal example (play + stop)

```java
context.audio().play(player, Map.of(
        "id", "ui:click",
        "sound", "minecraft:ui.button.click",
        "volume", 1.0
));

// later…
context.audio().stop(player, Map.of(
        "id", "ui:click"
));
```

## Music crossfade
```java
public void playTrack(PluginContext context, PlayerContext player, String track) {
    context.audio().play(player, Map.of(
            "id", "music:" + track,
            "sound", "moud:music/" + track,
            "category", "music",
            "loop", true,
            "volume", 0.5,
            "fadeInMs", 1500,
            "crossFadeGroup", "music",
            "crossFadeMs", 2500
    ));
}
```

This guarantees you won’t end up with “two songs on top of each other” when switching tracks.

## Option keys

Audio options are sent as a `Map<String, Object>`.
Keys mirror the TypeScript `SoundPlayOptions` / `SoundUpdateOptions` / `SoundStopOptions` shapes:

- `id` (required)
- `sound` (required for `play`)
- `volume`, `pitch`, `loop`
- `fadeInMs`, `fadeOutMs`, `fadeInEasing`, `fadeOutEasing`
- `positional`, `position` (`{x,y,z}`), `minDistance`, `maxDistance`, `distanceModel`, `rolloff`
- `pitchRamp`, `volumeLfo`, `pitchLfo`
- `mixGroup`, `duck`
- `crossFadeGroup`, `crossFadeMs`

If you want the full list with descriptions, see **Features → Audio & Voice** and **TypeScript API → Audio API**.

