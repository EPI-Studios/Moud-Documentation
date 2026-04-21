# Loading screen

The play-mode loading screen is a full-screen UI overlay that renders when a client connects to a production server or transitions from the editor into active simulation. The overlay evaluates at the end of the client render pipeline, ensuring it is unaffected by active post-processing effects. 

---

## Technical behavior

### Dismissal criteria

The engine maintains the loading overlay until all of the following conditions evaluate to `true`:

1.  **Server readiness:** The server has transmitted the `PlayReady` network packet.
2.  **Queue exhaustion:** The internal status queue is completely empty, indicating all asynchronous subsystem tasks (e.g., shader compilation, asset retrieval) have concluded.
3.  **Minimum duration:** A minimum execution window of 800 milliseconds has elapsed. This enforces a visual baseline and prevents single-frame flashes during rapid local transitions.

Upon satisfying these conditions, the overlay executes an alpha fade transition and dispatches any callbacks registered to the `playmode` API.

### Status queue evaluation

Engine subsystems allocate and deallocate status identifiers within an internal queue during asynchronous operations. The overlay evaluates the most recently allocated queue entry to render the active status string.

**Built-in subsystem identifiers:**

| Identifier | Evaluation period |
|---|---|
| `"server"` | Allocated upon play-mode initialization; deallocated upon receiving the `PlayReady` packet. |
| `"shader:<programId>"` | Allocated for the duration of a post-process GLSL compilation sequence. |
| `"asset:<id>"` | Allocated for the duration of an active asset download. |

**Aggregation:** The renderer automatically aggregates concurrent tasks from identical subsystems into a summarized string. For example, multiple active `shader:*` entries evaluate to `"Compiling shaders (N)"` rather than displaying individual program IDs.

### Display properties

The project title rendered in the overlay is inherited directly from the server's `ProjectInfo.name` parameter. If this parameter is undefined or the packet is unreceived, the engine defaults to the string `"Moud"`.

---

## API reference

The `playmode` API provides client scripts with execution hooks tied to the loading screen's lifecycle.

| Method | Returns | Description |
|---|---|---|
| `playmode:isReady()` | `boolean` | Evaluates to `true` if the loading sequence has successfully concluded and the overlay is dismissed. |
| `playmode:onReady(callback: function)` | `void` | Registers a callback function. The engine executes this function exactly once upon dismissal of the loading screen. |
| `playmode:currentStatus()` | `string` | Returns the raw string currently evaluated by the active status queue entry. |

### Implementation example

The following client script defers a local audio event until the loading sequence has fully concluded.

```lua
local script = {}

function script.onReady()
    -- Evaluate current state to prevent redundant execution
    if playmode:isReady() then
        script.startAmbientAudio()
    else
        -- Defer execution until the queue clears
        playmode:onReady(function()
            script.startAmbientAudio()
        end)
    end
end

function script.startAmbientAudio()
    -- Audio execution logic
end

return script
```