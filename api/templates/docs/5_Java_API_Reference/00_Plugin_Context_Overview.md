# Plugin Context

`PluginContext` is the “service locator” object Moud passes to your plugin during `onLoad` and `onEnable`.
It’s how you reach server services (players, scheduler, events…) and client-facing systems (UI overlays, camera, particles, etc.) from Java.

There are **two** ways you’ll use it:

1. **Raw services** via `context().<service>()` (interfaces under `com.moud.plugin.api.services.*`)
2. **Convenience DSL** helpers on `Plugin` (methods like `world()`, `schedule()`, `events()`, `command()`)

---

## What you actually get today

This table reflects the current `com.moud.plugin.api.PluginContext` surface that the server provides.

| Category | Accessor | Type | What it’s for |
| --- | --- | --- | --- |
| Metadata | `description()` | `PluginDescription` | Plugin id/name/version/description from `plugin.yml`. |
| IO | `dataDirectory()` | `Path` | Persistent per-plugin storage (`.moud/plugins-data/<id>/`). |
| Logging | `logger()` | `Logger` | Plugin-scoped logger. |
| Scheduler | `scheduler()` | `SchedulerService` | Delayed/repeating/async tasks. |
| Events | `events()` | `EventService` | Subscribe to plugin events (`listen`, `removeAll`). |
| Commands | `commands()` | `CommandService` | Register/unregister Minestom commands. |
| Players | `players()` | `PlayerService` | Find/broadcast/message/teleport players. |
| Client bridge | `clients()` | `ClientService` | Send named events/payloads to client scripts. |
| Network | `network()` | `NetworkService` | Broadcast/send raw/object payloads to clients. |
| Models | `models()` | `ModelService` | Spawn/remove models. |
| World | `world()` | `WorldService` | World time + create displays/text (not model spawning). |
| Lighting | `lighting()` | `LightingService` | Create/update/remove lights. |
| Particles | `particles()` | `ParticleService` | Spawn bursts, upsert/remove emitters. |
| Physics | `physics()` | `PhysicsController` | Attach/detach physics bodies to models. |
| Cameras | `cameras()` | `CameraService` | Server-driven player camera controls. |
| Rendering | `rendering()` | `RenderingController` | Post effects + toasts. |
| Zones | `zones()` | `ZoneService` | Create/remove AABB zones (no callbacks yet). |

---

## Plugin base class helpers 

If your main class extends `com.moud.plugin.api.Plugin` (recommended + required by the current loader), you also get:

- `world()` → `WorldDsl` (time + spawn models + lights + displays + text)
- `schedule()` → `SchedulerDsl` (tick/seconds/minutes helpers)
- `events()` → `EventsDsl` (typed server events + named client events)
- `command("name")` → `CommandDsl`
- `player(PlayerContext)` → `Player` facade (has `uiOverlay()` + `send(...)`)

---

## Things you might see in `plugin-api` but can’t access yet

Some services exist in `plugin-api` (and even have server implementations), but they are not currently exposed on `PluginContext`:

- `AudioService`, `MicrophoneService`, `VoiceService`
- `IKService`, `PrimitiveService`

If you need them immediately, wire them into `PluginContext` + `PluginContextImpl` as part of the server/plugin integration.

---

## Code sample 

```java
import com.moud.plugin.api.Plugin;
import com.moud.plugin.api.events.PlayerJoinEvent;

public final class ContextDemoPlugin extends Plugin {
    @Override
    protected void onEnable() {
        logger().info("Players online: {}", context().players().onlinePlayers().size());

        on(PlayerJoinEvent.class, event ->
                player(event.player()).sendMessage("Welcome!")
        );

        command("ping")
                .description("Replies with Pong!")
                .executor(ctx -> {
                    if (ctx.player() != null) {
                        ctx.player().sendMessage("Pong!");
                    } else {
                        logger().info("Pong!");
                    }
                })
                .register();
    }
}
```
