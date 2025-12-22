# Shared Values (Reference)

Shared Values are the way to synchronise per-player data between the Minestom server and the Fabric client. They power HUDs, ability cooldowns, quest states, and any UI/logic that needs the latest server-side truth.

## Architecture Recap

1. `player.getShared().getStore(name)` returns (or creates) a server-side `SharedValueStore`.
2. `SharedValueManager` diffs mutations, batches them via `ValueSynchronizer`, and emits lightweight packets through `ServerNetworkManager`.
3. `Moud.shared.getStore(name)` exposes the client cache; `ClientSharedValueManager` raises `onChange` callbacks whenever deltas arrive.
4. Hybrid keys can be written by the client; writes are validated server-side before being accepted.
5. `/sharedinspect` pulls live snapshots for debugging (enable with `moud dev --dev-utils`).

## Server API (Player Script)

```ts
const stats = player.getShared().getStore('playerStats');
stats.set('health', 100);                             // batched + hybrid
stats.set('maxHealth', 100, 'batched', 'server_only');
stats.set('ultimateReady', false, 'immediate');      // flush instantly

if (!stats.has('xp')) stats.set('xp', 0);
const xp = stats.get('xp') as number;
stats.set('xp', xp + 25);

stats.remove('debug');                               // deletes key client-side too
```

Parameters for `set`:

| Arg | Description |
| --- | --- |
| `key: string` | Case-sensitive identifier. |
| `value: any` | Any JSON-serialisable data (numbers, booleans, objects, arrays). |
| `syncMode?: 'batched' | 'immediate'` | Batch multiple changes (default) or flush immediately. |
| `permission?: 'hybrid' | 'server_only'` | Whether the client may call `.set()` too. |

Other helpers:

- `store.get(key)` – returns the last server-side value.
- `store.has(key)` – boolean.
- `store.keys()` – convenience listing.
- `store.remove(key)` – removes and syncs deletion.

## Client API (Fabric Script)

```ts
const stats = Moud.shared.getStore('playerStats');

stats.onChange('health', (value, prev) => {
  const max = stats.get('maxHealth') ?? 100;
  healthBar.setWidth(140 * (value / max));
});

stats.on('change', (key, value) => console.log(`${key} ->`, value));

if (stats.canModify('selectedSlot')) {
  stats.set('selectedSlot', 2); // request server update for hybrid key
}
```

Client stores expose:

| Method | Description |
| --- | --- |
| `get(key)` / `has(key)` | Reads cached values. Returns `undefined` until the first sync arrives. |
| `onChange(key, callback)` | Fires only when that key changes. |
| `on('change', callback)` | Fires for every mutation in the store. |
| `set(key, value)` | Attempts a client-driven update. Works only for keys marked `hybrid`. Returns `true` if the request was sent. |
| `canModify(key)` | Boolean guard for `set`. |

## Hybrid Workflow Example

Scenario: client-side radial menu selects an emote; server validates, updates, and broadcasts.

```ts
// client
radialMenu.onSelect((slot) => {
  const store = Moud.shared.getStore('playerState');
  if (store.canModify('selectedEmote')) {
    store.set('selectedEmote', slot);
  }
});
```

```ts
// server
api.on('player.join', (player) => {
  const store = player.getShared().getStore('playerState');
  store.set('selectedEmote', null, 'batched', 'hybrid');
});

const allowed = new Set(['wave', 'dance', 'salute']);
player.getShared().getStore('playerState').onClientUpdate?.(/* stuff */);

api.on('player.movement.start', (player) => {
  const store = player.getShared().getStore('playerState');
  const emote = store.get('selectedEmote');
  if (emote && allowed.has(emote)) {
    player.animation.playAnimation(`emotes:${emote}`);
  } else {
    store.set('selectedEmote', null);
  }
});
```

Even if the client sends an invalid value, the server can overwrite it immediately; the authoritative version is always whatever the server last wrote.


