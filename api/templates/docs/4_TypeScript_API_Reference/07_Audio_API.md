# Audio API 

This page documents the **client-side** audio surface exposed as `Moud.audio`.

If you’re writing **server scripts**, you don’t use `Moud.audio` directly-you use `player.getAudio()` (see “Audio & Voice” in the Features section).

---

## Quick start

### Play a UI click (client-side)

```ts
Moud.audio.play({
    id: 'ui:click',
    sound: 'minecraft:ui.button.click',
    volume: 1.0
});
```

### Loop ambience with a fade, then stop it later

```ts
Moud.audio.play({
    id: 'ambience:wind',
    sound: 'minecraft:ambient.cave',
    category: 'ambient',
    loop: true,
    volume: 0.35,
    fadeInMs: 800
});

// ...later
Moud.audio.stop({ id: 'ambience:wind', fadeOutMs: 600 });
```

---

## The Model

- `id` is the identity of a sound instance. If you call `play()` twice with the same `id`, you’re replacing/updating the same logical sound.
- Prefer **stable ids** (`music:intro`, `ui:click`, `npc:123:hum`) over random ids.
- The client caps managed sounds (64). If you constantly generate new ids, you’ll hit the ceiling.

---

## API surface

### Audio playback

```ts
Moud.audio.play(options: SoundPlayOptions): void
Moud.audio.update(options: SoundUpdateOptions): void
Moud.audio.stop(options: SoundStopOptions): void
```

### Microphone + Voice helpers (client-only)

```ts
const mic = Moud.audio.getMicrophone();
const voice = Moud.audio.getVoice();

mic.start(options?: MicrophoneStartOptions): void
mic.stop(): void
mic.isActive(): boolean
mic.getInputDevices(): string[]
mic.getPreferredInputDevice(): string
mic.setPreferredInputDevice(deviceName: string): void

voice.registerProcessor(id: string, factory: VoiceProcessorFactory): void
voice.setEnabled(enabled: boolean): void
voice.isEnabled(): boolean
voice.setOutputProcessing(speakerUuid: string, processing: VoiceProcessingSpec): void
voice.clearOutputProcessing(speakerUuid: string): void
```

---

## Sound options 

`SoundPlayOptions` is intentionally “one object that scales from simple → advanced”.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Required. Unique per client. |
| `sound` | `string` | Namespaced sound id. Must exist in client resources. |
| `category` | `SoundCategory` | Defaults to `master`. |
| `volume` | `number` | Default `1.0`. |
| `pitch` | `number` | Default `1.0`. |
| `loop` | `boolean` | Default `false`. |
| `startDelayMs` | `number` | Delay before starting playback. |
| `fadeInMs` / `fadeOutMs` | `number` | Envelope times. |
| `fadeInEasing` / `fadeOutEasing` | `linear \| ease_in \| ease_out \| ease_in_out` | Easing for fades. |
| `positional` | `boolean` | Enables 3D attenuation/panning. |
| `position` | `Vector3 \| [x,y,z]` | World-space position for 3D sounds. |
| `minDistance` / `maxDistance` | `number` | Attenuation range. |
| `distanceModel` | `linear \| inverse \| exponential` | How distance impacts volume. |
| `rolloff` | `number` | Extra attenuation multiplier. |
| `pitchRamp` | `{ pitch, durationMs, easing? }` | Smooth pitch glide. |
| `volumeLfo` | `{ frequencyHz, depth, waveform? }` | Tremolo. `depth` is 0..1. |
| `pitchLfo` | `{ frequencyHz, depthSemitones, waveform? }` | Vibrato. |
| `mixGroup` | `string` | Used by ducking / mix control. |
| `duck` | `{ group, amount, attackMs?, releaseMs? }` | Duck another group while this plays. |
| `crossFadeGroup` | `string` | Auto-fade previous members in group. |
| `crossFadeMs` | `number` | Crossfade duration. |

`SoundStopOptions`:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Required. |
| `fadeOutMs` | `number` | If omitted, stops immediately unless `immediate` is set. |
| `immediate` | `boolean` | Force stop now (even if fading). |

---

## Microphone options (client capture)

The microphone API controls capture on the client. What happens with that captured audio depends on your setup:

- In the default Moud voice pipeline, captured frames are processed and shipped as voice packets.
- If you enable `legacyScriptEvents`, the client also emits `audio:microphone:*` script events (chunk/state/error) back to the server.

`MicrophoneStartOptions`:

| Field | Type | Notes |
| --- | --- | --- |
| `sessionId` | `string` | Optional label for your session. |
| `sampleRate` | `number` | Defaults to 48000 on the Java mic path. |
| `frameSizeMs` | `number` | Typical values: 10/20/40ms. |
| `legacyScriptEvents` | `boolean` | Emit JSON mic events (`audio:microphone:*`). |
| `vad` | `{ thresholdDb?, hangoverMs?, dropSilence? }` | Voice activity detection tuning. |
| `inputProcessing` | `VoiceProcessingSpec` | Processor chain + gain applied to outgoing mic samples. |
| `inputProcessors` | `Array<string | VoiceProcessorRef>` | Shorthand chain form. |

Example: start capture with voice-activity detection tuning:

```ts
const mic = Moud.audio.getMicrophone();
mic.start({
    sessionId: 'moud:voice',
    vad: { thresholdDb: 35, hangoverMs: 200, dropSilence: true }
});
```

---

## Selecting a microphone device

```ts
const mic = Moud.audio.getMicrophone();

const devices = mic.getInputDevices();
console.log('devices', devices);

// pick one (persisted for future sessions)
mic.setPreferredInputDevice(devices[0] ?? '');
console.log('preferred', mic.getPreferredInputDevice());
```

---

## Voice processors

### What processors receive

`VoiceProcessor` is called with:

- `samples`: an array of PCM samples (signed 16-bit range, roughly `-32768..32767`)
- `ctx`: metadata (`direction`, `speaking`, `level`, `speakerId`, `sampleRate`, etc.)

### Register a simple “soft clip” processor

```ts
const voice = Moud.audio.getVoice();

voice.registerProcessor('moud:soft_clip', () => {
    const threshold = 22000;
    return (samples) => {
        for (let i = 0; i < samples.length; i++) {
            const s = samples[i];
            if (s > threshold) samples[i] = threshold;
            else if (s < -threshold) samples[i] = -threshold;
        }
    };
});
```

### apply processing to a specific speaker (client-side)

```ts
voice.setOutputProcessing('SPEAKER_UUID_HERE', {
    gain: 0.9,
    chain: ['moud:soft_clip']
});
```

This only affects your local playback of that speaker.
