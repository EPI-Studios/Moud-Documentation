# Client-Server Synchronisation (Shared Values)

UI overlays, HUDs, cursors, and audio cues almost always need up-to-date data from the authoritative server. Moud’s **Shared Values** system solves that problem without requiring you to design custom packets. Think of it as per-player, reactive key-value stores with built-in permissions and diffing.

```
[Server SharedValueStore]  <-- ValueSynchronizer -->  [Client SharedValueStore]
         ^ (authoritative)                                 ^ (cached copy)
```

## How it Works

1. Each player has an arbitrary number of named stores (`player.getShared().getStore('playerStats')`).
2. Stores are simple string → JSON-serialisable value maps.
3. `SharedValueManager` diffs store mutations, batches them (`batched` mode) or flushes immediately, and sends compact packets through `ServerNetworkManager`.
4. `client-mod` receives the delta, updates its own `ClientSharedValueManager`, and fires callbacks registered via `Moud.shared.getStore(...).onChange(...)`.
5. If a key is marked `hybrid`, the client may call `.set()` locally, the change is validated server-side before being applied.

`DevUtilities` expose `/sharedinspect` so you can inspect every store/key pair live while developing.

## Server API

```ts
api.on('player.join', (player) => {
  const stats = player.getShared().getStore('playerStats');
  stats.set('mana', 100);                    // batched + hybrid (default)
  stats.set('maxMana', 100, 'batched', 'server_only');
  stats.set('loadout', ['staff', 'cloak']);
});
```

`set(key, value, syncMode?, permission?)`

- **`syncMode`**
  - `batched` (default) – accumulate writes during the current tick and send them as one payload.
  - `immediate` – flush right away, ideal for health bars or situations where latency matters more than bandwidth.
- **`permission`**
  - `hybrid` (default) – server and client may both call `.set()`. The server always wins if there’s a conflict.
  - `server_only` / `client_readonly` – only the server may mutate. Client attempts return `false`.

```hint tip Use stores as boundaries
Create multiple stores per player (`playerStats`, `hud`, `abilities`). It keeps payloads atomic and reduces accidental `onChange` spam.
```

Other helpers:

| Method | Description |
| --- | --- |
| `store.get(key)` | Returns the last known value (server-side). |
| `store.has(key)` | Boolean. |
| `store.remove(key)` | Deletes a key and propagates the deletion. |
| `store.keys()` | Returns known keys (server-side convenience). |

## Client API

```ts
const stats = Moud.shared.getStore('playerStats');

stats.onChange('mana', (mana, prev) => {
  const max = stats.get('maxMana') ?? 100;
  manaLabel.setText(`Mana: ${mana}/${max}`);
  manaBar.setWidth(146 * (mana / max));
});

stats.on('change', (key, value) => {
  console.log('Any key changed', key, value);
});
```

- `onChange(key, callback)` fires only when the key changes.
- `on('change', callback)` fires for every mutation in the store.
- `get`, `has`, `keys`, `entries` mirror the server API.
- `set` returns `true` when the client is allowed to request a change (hybrid keys). The server will echo the authoritative value back once it validates it.

```ts
const loadout = Moud.shared.getStore('playerStats');
if (loadout.canModify('selectedSlot')) {
  loadout.set('selectedSlot', 2);  // optimistic update
}
```

## Diagnostics

- `/sharedinspect <player> [store]` – prints store metadata plus last-writer, dirty flags, and timestamps. Requires `moud dev --dev-utils`.
- `SharedStoreSnapshot` objects provide structured data for custom dashboards if you need more than the built-in command.
- `SharedValueManager.snapshotAllStores()` can be invoked from debug scripts to emit JSON into logs.

## Best Practices

1. **Keep payloads JSON-friendly** – Avoid functions/classes.
2. **Chunk large data** – for big collections (like inventory) consider storing them under separate keys (`slots.0`, `slots.1`, …) instead of a single 400-item array to reduce network bandwight


