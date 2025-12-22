# Microphone Service

`MicrophoneService` lets a Java plugin **start/stop microphone capture** on a player’s client and inspect the last-known session state.

This is the “raw capture” layer. It’s useful when you want to build custom features on top

```hint warn You SHOULD have the MOD
Works only for players using the Moud client mod. The server silently ignores audio commands for non-Moud clients
``` 


## Start / stop capture

```java
context.microphone().start(player, Map.of(
        "sessionId", "mic:test:" + player.uuid(),
        "sampleRate", 48000,
        "frameSizeMs", 20
));

// later
context.microphone().stop(player);
```

## Check if it’s active

```java
boolean active = context.microphone().isActive(player);
context.logger().info("Mic active for {}: {}", player.username(), active);
```

## Reading the session snapshot

```java
Map<String, Object> session = context.microphone().session(player);
if (session == null) return;

context.logger().info("Mic session {} active={} state={}",
        session.get("sessionId"),
        session.get("active"),
        session.get("state")
);
```

Fields you can expect in the snapshot:

- `sessionId` (string)
- `active` (boolean)
- `state` (string, when reported)
- `timestamp` (number, last observed chunk timestamp)
- `sampleRate` (number)
- `channels` (number)
- `chunkBase64` (string, present when legacy mic events are enabled on the client)

## About `legacyScriptEvents`

If you start the mic with `legacyScriptEvents: true`, the client will emit JSON mic events back to the server (`audio:microphone:chunk`, `audio:microphone:state`, `audio:microphone:error`).

That can be useful if you want mic chunks as “script events” instead of going through the voice pipeline.

