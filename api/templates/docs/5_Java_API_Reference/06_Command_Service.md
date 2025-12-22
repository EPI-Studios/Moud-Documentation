# Command Service 

Command registration and execution API. Exposed via `PluginContext.commands()` and the fluent `CommandDsl` (`command("name")` in `Plugin`).

## Method Summary
| Method | Signature | Description |
| --- | --- | --- |
| `register` | `RegisteredCommand register(String name, CommandExecutor executor)` | Register a command under a root name. |
| `register` (aliases) | `RegisteredCommand register(String name, Collection<String> aliases, CommandExecutor executor)` | Register with aliases sharing the same executor. |
| `unregisterAll` | `void unregisterAll()` | Remove every command registered by this service. |

### CommandDsl Helpers
| Method | Signature | Description |
| --- | --- | --- |
| `aliases` | `CommandDsl aliases(Collection<String> aliases)` | Add alternative triggers. |
| `executor` | `CommandDsl executor(Consumer<CommandContext> executor)` | Set handler receiving a high-level `CommandContext`. |
| `description` | `CommandDsl description(String description)` | Set help text. |
| `register` | `RegisteredCommand register()` | Finalize and register the command. |

## Detailed Member Docs

### register
- **Signature**: `RegisteredCommand register(String name, CommandExecutor executor)`
- **Parameters**:
  - `name` - root command name.
  - `executor` - callback invoked on execution (`CommandExecutor`). 
- **Returns**: `RegisteredCommand` handle.
- **Description**: Registers a command using a raw executor. Use `CommandDsl` to get `CommandContext` with wrapped `Player`.

### register (aliases)
- **Signature**: `RegisteredCommand register(String name, Collection<String> aliases, CommandExecutor executor)`
- **Parameters**:
  - `name` - root name.
  - `aliases` - alternative names.
  - `executor` - handler.
- **Returns**: `RegisteredCommand`.
- **Description**: Same as above but includes alias triggers.

### unregisterAll
- **Signature**: `void unregisterAll()`
- **Parameters**: None.
- **Returns**: `void`
- **Description**: Removes all commands registered by this plugin instance. Called on shutdown; can be invoked manually for reload flows.

### CommandDsl.aliases
- **Signature**: `CommandDsl aliases(Collection<String> aliases)`
- **Parameters**: `aliases` - additional triggers.
- **Returns**: `CommandDsl`.
- **Description**: Optional aliases for the same command handler.

### CommandDsl.executor
- **Signature**: `CommandDsl executor(Consumer<CommandContext> executor)`
- **Parameters**: `executor` - handler receiving `CommandContext` (player if present, input string, arguments list).
- **Returns**: `CommandDsl`.
- **Description**: Sets the command logic using a convenient context wrapper.

### CommandDsl.description
- **Signature**: `CommandDsl description(String description)`
- **Parameters**: `description` - help text.
- **Returns**: `CommandDsl`.
- **Description**: Sets description for help output.

### CommandDsl.register
- **Signature**: `RegisteredCommand register()`
- **Parameters**: None.
- **Returns**: `RegisteredCommand`.
- **Description**: Builds and registers the command via `CommandService`. Throws if executor is missing.

## Code Sample
```java
public final class CommandExample extends Plugin {
    @Override
    protected void onEnable() {
        // using DSL
        command("hello")
            .aliases(List.of("hi"))
            .description("Greets the caller")
            .executor(ctx -> {
                if (ctx.player() != null) {
                    ctx.player().sendMessage("Hello " + ctx.player().name() + "!");
                } else {
                    logger().info("Hello console!");
                }
            })
            .register();

        // raw service registration
        context().commands().register("echo", (sender, input, args) -> {
            sender.sendMessage("You said: " + String.join(" ", args));
        });

    }

    @Override
    public void onDisable() {
        context().commands().unregisterAll();
    }
}
```
