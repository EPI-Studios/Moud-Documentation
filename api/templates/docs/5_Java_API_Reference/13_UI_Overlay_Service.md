# UI Overlay Service

Server-driven UI overlays let Java plugins draw HUD elements on the client without shipping extra client code. Accessed via `Player.uiOverlay()`.

## Method Summary
| Method | Signature | Description |
| --- | --- | --- |
| `upsert` | `String upsert(UIOverlayDefinition def)` | Create/update a single element (returns id). |
| `upsertMany` | `void upsertMany(Collection<UIOverlayDefinition> defs)` | Batch create/update elements. |
| `remove` | `void remove(String id)` | Remove a component by id. |
| `removeMany` | `void removeMany(Collection<String> ids)` | Remove multiple components. |
| `clear` | `void clear()` | Remove all overlay elements for this player. |
| `onInteraction` | `void onInteraction(UIOverlayInteractionListener listener)` | Receive click/change/submit/hover/focus/blur events. |

### Builder Helpers
| Helper | Signature | Description |
| --- | --- | --- |
| `OverlayComponentBuilder` | `container/text/button/image(...).parent(...).fullscreen().pos().size().background().text().textColor().textAlign().anchor().justifyContent().alignItems().gap().padding().border().opacity().scale().prop(...)` | Fluent builder for overlay elements. |
| Enums | `Anchor`, `Align`, `Justify`, `TextAlign` | Typed layout/text enums (avoid raw strings). |
| Convenience | `PlayerOverlay.upsert(OverlayComponentBuilder)` and varargs overloads for `upsertMany(...)` | Build-and-send in one call. |

## Detailed Members

### upsert / upsertMany
- **Signature**: `String upsert(UIOverlayDefinition def)`; `void upsertMany(Collection<UIOverlayDefinition> defs)`
- **Description**: Create or update elements. Reusing the same `id` updates in place. Varargs and builder overloads are available.

### remove / removeMany
- **Signature**: `void remove(String id)`; `void removeMany(Collection<String> ids)`
- **Description**: Detach elements by id.

### clear
- **Signature**: `void clear()`
- **Description**: Remove all server-driven overlay elements for this player.

### onInteraction
- **Signature**: `void onInteraction(UIOverlayInteractionListener listener)`
- **Description**: Register/unregister a callback for UI events (`click`, `change`, `submit`, `hover`, `unhover`, `focus`, `blur`). Payload is a `UIOverlayInteraction` with `elementId`, `action`, and `data` map.

## Supported Component Types
- `container` - flex layout: `flexDirection` (row/column), `justifyContent`, `alignItems`, `gap`, `padding`, `autoResize`, `background`, `border`, `opacity`, `anchor`, `fullscreen`.
- `text` - `text`, `textColor`, `textAlign`, `scale`.
- `button` - styled like text/container; fires `click`.
- `image` - `source` (namespaced texture id/path).

## Code Example

### Fullscreen Loading Mask (builder style)
```java
var root = OverlayComponentBuilder.container("loading_root")
        .fullscreen()
        .background("#F0000000")
        .justifyContent(Justify.CENTER)
        .alignItems(Align.CENTER)
        .gap(12)
        .build();

var title = OverlayComponentBuilder.text("loading_title", "Preparing world...")
        .parent("loading_root")
        .textColor("#FFFFFF")
        .textAlign(TextAlign.CENTER)
        .scale(1.5)
        .build();

var barBg = OverlayComponentBuilder.container("loading_bar_bg")
        .parent("loading_root")
        .width(480)
        .height(12)
        .background("#333333")
        .alignItems(Align.FLEX_START)
        .build();

var barFill = OverlayComponentBuilder.container("loading_bar_fill")
        .parent("loading_bar_bg")
        .width(1)
        .height(12)
        .background("#66CC66")
        .build();

player.uiOverlay().clear();
player.uiOverlay().upsertMany(root, title, barBg, barFill);
player.uiOverlay().onInteraction((p, evt) -> logger().info("UI event {} from {}", evt.action(), p.name()));
```

### Smooth Progress 
```java
int barWidth = 600, barHeight = 12;
long totalMs = 30_000, tickMs = 50, assetIntervalMs = 2_000;
List<String> assets = List.of("Textures", "Geometry", "Scripts", "Audio");

context.scheduler().runRepeating(new Runnable() {
    long elapsed = 0;
    @Override public void run() {
        elapsed += tickMs;
        double p = Math.min(1.0, elapsed / (double) totalMs);
        int w = Math.max(1, (int) (barWidth * p));
        String asset = assets.get((int)((elapsed / assetIntervalMs) % assets.size()));
        player.uiOverlay().upsertMany(
                OverlayComponentBuilder.text("loading_status", "Loading " + asset + " (" + (int)(p*100) + "%)")
                        .parent("loading_root")
                        .textColor("#AAAAAA")
                        .textAlign(TextAlign.CENTER),
                OverlayComponentBuilder.container("loading_bar_fill")
                        .parent("loading_bar_bg")
                        .width(w)
                        .height(barHeight)
                        .background("#00E5FF")
        );
        if (p >= 1.0) {
            player.uiOverlay().upsert(
                    OverlayComponentBuilder.text("loading_status", "Connection Established")
                            .parent("loading_root")
                            .textColor("#00E5FF")
                            .textAlign(TextAlign.CENTER)
            );
            context.scheduler().runLater(() -> player.uiOverlay().clear(), java.time.Duration.ofMillis(800));
        }
    }
}, java.time.Duration.ZERO, java.time.Duration.ofMillis(tickMs));
```

## Notes
- Requires the Moud client mod; non-Moud clients ignore overlay packets.
- Keep IDs stable when updating elements to avoid flicker.
- For smooth animations, update only the properties that change (e.g., `width` or `text`) and use small intervals. 
