# Rendering Controller 

Server-side controls for client rendering effects and toasts. Exposed via `PluginContext.rendering()`.

## Method Summary
| Method | Signature | Description |
| --- | --- | --- |
| `applyPostEffect` | `void applyPostEffect(String effectId)` | Apply a post-processing effect globally/on all clients. |
| `removePostEffect` | `void removePostEffect(String effectId)` | Remove a specific post effect. |
| `clearPostEffects` | `void clearPostEffects()` | Remove all post effects. |
| `toast` | `void toast(PlayerContext player, String title, String body)` | Show a toast notification to a player. |

## Detailed Member Docs

### applyPostEffect
- **Signature**: `void applyPostEffect(String effectId)`
- **Parameters**: `effectId` - namespaced effect id (e.g., `moud:bloom`).
- **Returns**: `void`
- **Description**: Applies a post-processing effect for clients. Effect identifiers correspond to client-side resources configured in the mod.

### removePostEffect
- **Signature**: `void removePostEffect(String effectId)`
- **Parameters**: `effectId` - id to remove.
- **Returns**: `void`
- **Description**: Removes a specific post effect.

### clearPostEffects
- **Signature**: `void clearPostEffects()`
- **Parameters**: None.
- **Returns**: `void`
- **Description**: Clears all applied post effects for clients.

### toast
- **Signature**: `void toast(PlayerContext player, String title, String body)`
- **Parameters**:
  - `player` - target player.
  - `title` - toast title.
  - `body` - toast body text.
- **Returns**: `void`
- **Description**: Displays a client-side toast notification to a specific player via the client mod.

## Code Example
```java
public final class RenderingExample extends Plugin {
    @Override
    public void onEnable(PluginContext context) {
        // apply bloom
        context.rendering().applyPostEffect("moud:bloom");

        // toast the next joiner
        context.events().listen(PlayerJoinEvent.class, event -> {
            PlayerContext p = event.player();
            context.rendering().toast(p, "Welcome", "Bloom is enabled");
        });
    }

    @Override
    public void onDisable() {
        context().rendering().clearPostEffects();
    }
}
```
