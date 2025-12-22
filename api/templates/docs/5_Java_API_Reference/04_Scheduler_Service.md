# Scheduler Service 

Task scheduling API exposed via `PluginContext.scheduler()` and the fluent `SchedulerDsl` (`schedule()` in `Plugin`). Supports delayed, repeating, and async tasks aligned with server ticks.

## Method Summary
| Method | Signature | Description |
| --- | --- | --- |
| `runLater` | `ScheduledTask runLater(Runnable runnable, Duration delay)` | Run once after a delay. |
| `runRepeating` | `ScheduledTask runRepeating(Runnable runnable, Duration delay, Duration interval)` | Run repeatedly with initial delay and fixed interval. |
| `runAsync` | `ScheduledTask runAsync(Runnable runnable)` | Execute asynchronously off the main thread. |
| `cancelAll` | `void cancelAll()` | Cancel all tasks scheduled by this service. |

### SchedulerDsl (convenience)
| Method | Signature | Description |
| --- | --- | --- |
| `every.seconds` | `void every(long value).seconds(Runnable runnable)` | Run every N seconds. |
| `every.ticks` | `void every(long value).ticks(Runnable runnable)` | Run every N ticks (20 ticks = 1s). |
| `every.minutes` | `void every(long value).minutes(Runnable runnable)` | Run every N minutes. |

## Detailed Member 

### runLater
- **Signature**: `ScheduledTask runLater(Runnable runnable, Duration delay)`
- **Parameters**:
  - `runnable` : task to execute.
  - `delay` : delay before first run.
- **Returns**: `ScheduledTask` with cancellation controls.
- **Description**: Schedules a one-shot task on the server scheduler after the specified delay.

### runRepeating
- **Signature**: `ScheduledTask runRepeating(Runnable runnable, Duration delay, Duration interval)`
- **Parameters**:
  - `runnable` : task to execute.
  - `delay` : initial delay.
  - `interval` : interval between executions.
- **Returns**: `ScheduledTask`.
- **Description**: Repeats the task at a fixed rate. Use `ScheduledTask.cancel()` to stop.

### runAsync
- **Signature**: `ScheduledTask runAsync(Runnable runnable)`
- **Parameters**: `runnable` : task to execute asynchronously.
- **Returns**: `ScheduledTask`.
- **Description**: Executes work off the main server thread. Avoid touching game state directly; dispatch results back to main thread if needed.

### cancelAll
- **Signature**: `void cancelAll()`
- **Parameters**: None.
- **Returns**: `void`
- **Description**: Cancels all tasks created via this scheduler service. Invoked automatically on plugin shutdown.

### SchedulerDsl.every.seconds
- **Signature**: `void every(long value).seconds(Runnable runnable)`
- **Parameters**:
  - `value` : interval in seconds.
  - `runnable` : task to run.
- **Returns**: `void`
- **Description**: Convenience wrapper that maps seconds to `runRepeating` with equal delay/interval.

### SchedulerDsl.every.ticks
- **Signature**: `void every(long value).ticks(Runnable runnable)`
- **Parameters**:
  - `value` : interval in ticks (20 ticks = 1 second).
  - `runnable` : task to run.
- **Returns**: `void`
- **Description**: Tick-based repeating schedule.

### SchedulerDsl.every.minutes
- **Signature**: `void every(long value).minutes(Runnable runnable)`
- **Parameters**:
  - `value` : interval in minutes.
  - `runnable` : task to run.
- **Returns**: `void`
- **Description**: Minute-based repeating schedule.

## Code Example
```java
public final class SchedulerExample extends Plugin {
    private ScheduledTask pulse;

    @Override
    protected void onEnable() {
        // one shot after 3 seconds
        context().scheduler().runLater(() ->
                logger().info("Server warmed up"), Duration.ofSeconds(3));

        // repeating every 10 seconds
        pulse = context().scheduler().runRepeating(
                () -> context().players().broadcastActionBar("§7Heartbeat"),
                Duration.ofSeconds(10),
                Duration.ofSeconds(10)
        );

        // every 20 ticks (1 second)
        schedule().every(20).ticks(() ->
                logger().debug("Tick task fired"));
    }

    @Override
    public void onDisable() {
        if (pulse != null) pulse.cancel();
        context().scheduler().cancelAll();
    }
}
```
