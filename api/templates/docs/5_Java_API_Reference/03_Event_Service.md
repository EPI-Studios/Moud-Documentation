# Event Service

Moud plugins can subscribe to **plugin events** (server-side) via `EventService`.

There are two entry points:

- Raw service: `context().events()` → `EventService` (`listen(...)`, `removeAll()`)
- Convenience DSL: `events()` → `EventsDsl` (`on(...)`, `onClient(...)`)

## Common event types you’ll actually use

Moud ships a small set of strongly-typed plugin events (all in `com.moud.plugin.api.events`):

- `PlayerJoinEvent` / `PlayerLeaveEvent`
- `ScriptEvent` (a generic “client script event happened” envelope)
- Voice lifecycle:
  - `PlayerVoiceStartEvent`
  - `PlayerVoiceStopEvent`
  - `PlayerVoiceLevelEvent`

If you’re unsure where something shows up, `ScriptEvent` is the universal fallback: it gives you the raw `eventName` + `payload`.

## Method Summary
| Method | Signature | Description |
| --- | --- | --- |
| `listen` | `<T extends PluginEvent> Subscription listen(Class<T> eventType, EventListener<T> listener)` | Register a listener for a specific event class. |
| `removeAll` | `void removeAll()` | Unregister all listeners created by this service instance. |

## Detailed Member 

### listen
- **Signature**: `<T extends PluginEvent> Subscription listen(Class<T> eventType, EventListener<T> listener)`
- **Parameters**:
  - `eventType` : concrete class of the event to subscribe to (e.g., `PlayerJoinEvent`).
  - `listener` : callback invoked when the event fires.
- **Returns**: `Subscription` handle with `unsubscribe()` to remove the listener manually.
- **Description**: Registers a strongly-typed listener on the server-side event bus. Runs on the server thread. Use `unsubscribe()` to stop receiving events or `removeAll()` to clear all at once.

### removeAll
- **Signature**: `void removeAll()`
- **Parameters**: None.
- **Returns**: `void`
- **Description**: Unsubscribes every listener registered through this `EventService` instance. Called automatically when plugins unload, but can be invoked explicitly during runtime resets.

## Code Example
```java
public final class EventExample extends Plugin {
    private Subscription joinSub;

    @Override
    protected void onEnable() {
        joinSub = events().on(PlayerJoinEvent.class, event ->
                player(event.player()).sendMessage("Hello " + event.player().username() + "!")
        );

        events().on(PlayerVoiceStartEvent.class, event ->
                context().players().sendActionBar(event.player(), "Speaking…")
        );
    }

    @Override
    public void onDisable() {
        if (joinSub != null) {
            joinSub.unsubscribe();
        }
        context().events().removeAll();
    }
}
```
