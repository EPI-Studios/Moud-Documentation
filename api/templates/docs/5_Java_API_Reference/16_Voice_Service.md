# Voice Service

`VoiceService` controls the **Moud voice chat system** from Java plugins:

- read voice state (active/speaking/level/codec)
- configure routing (proximity, channel, direct targets…)
- start/stop voice recordings and replay them

```hint warn You SHOULD have the MOD
Works only for players using the Moud client mod. The server silently ignores audio commands for non-Moud clients
``` 

## The model

Voice is **routing-first**. You don’t “play voice”.

You decide who hears whom, and the runtime takes care of:

- receiving microphone frames
- choosing listeners
- applying output processing (optional)
- shipping `VoiceStreamChunkPacket` to targets

## Set default proximity voice

```java
context.voice().setRouting(player, Map.of(
        "mode", "proximity",
        "range", 16.0,
        "positional", true,
        "speechMode", "normal"
));
```

## Party chat 

```java
context.voice().setRouting(player, Map.of(
        "mode", "direct",
        "targets", List.of(leader.uuid().toString(), teammate.uuid().toString()),
        "positional", false
));
```

## Reading voice state

```java
Map<String, Object> state = context.voice().state(player);
if (state == null) return;

boolean speaking = Boolean.TRUE.equals(state.get("speaking"));
Number level = (Number) state.get("level");
context.logger().info("Voice speaking={} level={}", speaking, level);
```

The returned map includes (when available):

- `active`, `speaking`, `level`
- `lastSpokeAt`, `lastPacketAt`
- `sessionId`
- `codecParams` (`codec`, `sampleRate`, `channels`, `frameSizeMs`)
- `routing`
- `recordingId` (if recording)

## Recording + replay

```java
String recordingId = context.voice().startRecording(player, null, 30_000L);

// ... later
context.voice().stopRecording(player);

// replay to nearby players
context.voice().replayRecording(recordingId, Map.of(
        "range", 12.0,
        "position", Map.of("x", 0, "y", 70, "z", 0),
        "replayId", "replay:test"
));
```

## Routing option keys

Routing is provided as `Map<String, Object>`, mirroring the TypeScript `VoiceRoutingOptions` shape:

- `mode`: `proximity | channel | radio | direct`
- `range`: number
- `speechMode`: `normal | whisper | shout`
- `channel`: string
- `targets`: list of UUID strings
- `priority`: number
- `positional`: boolean
- `outputProcessing`: voice processor chain applied on receivers

`outputProcessing` uses the same structure as `VoiceProcessingSpec`:

- `gain`: number
- `replace`: boolean (replace server chain instead of appending)
- `chain`: list of processor ids / `{ id, options }`

## Voice events (recommended)

Instead of polling state, listen to voice events:

- `PlayerVoiceStartEvent`
- `PlayerVoiceStopEvent`
- `PlayerVoiceLevelEvent`

Example:

```java
context.events().listen(PlayerVoiceStartEvent.class, event -> {
    context.players().sendActionBar(event.player(), "Speaking…");
});
```

