# Plugin Lifecycle 

Lifecycle hooks for plugins built with `plugin-api`. The loader instantiates your class, injects a `PluginContext`, and calls these methods in order.

## Method Summary
| Method | Signature | Description |
| --- | --- | --- |
| `onLoad` | `void onLoad(PluginContext context)` | Runs right after construction; load config or prepare assets. |
| `onEnable` | `void onEnable(PluginContext context)` | Activate the plugin: register listeners/commands, start tasks, spawn content. |
| `onDisable` | `void onDisable()` | Stop tasks and remove anything you spawned. |

