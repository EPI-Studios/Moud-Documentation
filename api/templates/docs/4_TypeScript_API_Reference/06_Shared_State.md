# Shared State Sync

Key-value stores synchronised between the server and clients. This system allows you to replicate data (like stats, UI state, or game progress) without writing custom network packets. The server acts as the source of truth, while the client maintains a reactive cache.

Server scripts use `api.shared` (via player accessors), and client scripts use `Moud.shared`.

## Server API

### getStore
```ts
getStore(storeName: string): SharedStore
```
Retrieves or creates a named store for a specific player. Stores are isolated per-player, meaning `getStore('stats')` on Player A is different from Player B.

- **Parameters**: 
  - `storeName`: Identifier for the store (e.g., `rpg_stats`, `gui_state`).
- **Returns**: `SharedStore`.
- **Example**:
```ts
const stats = player.getClient().getShared().getStore('rpg_stats');
```

### set
```ts
set(key: string, value: any, syncMode?: 'batched' | 'immediate', permission?: 'hybrid' | 'server_only'): void
```
Writes a value to the store and syncs it to the client. You can control *when* it sends and *who* can modify it.

- **Parameters**: 
  - `key`: The entry key.
  - `value`: Any JSON-serializable value (number, string, boolean, object).
  - `syncMode`: 
    - `'batched'` (default): Updates are grouped and sent at the end of the tick to save bandwidth.
    - `'immediate'`: The packet is flushed instantly.
  - `permission`: 
    - `'hybrid'` (default): Both server and client can modify this value.
    - `'server_only'`: Only the server can write. Client attempts to `set` will be rejected.
- **Returns**: `void`.
- **Example**:
```ts
// server authoritative
store.set('health', 50, 'immediate', 'server_only');

// client can change it too
store.set('show_minimap', true, 'batched', 'hybrid');
```

### get / has / remove
```ts
get<T>(key: string): T | undefined
has(key: string): boolean
remove(key: string): void
```
Standard map operations. `get` returns the current server-side value. `remove` deletes the key and synchronizes the deletion to the client.

- **Example**:
```ts
if (store.has('score')) {
    const score = store.get<number>('score');
    store.set('score', score + 1);
}
```

### onChange
```ts
onChange(key: string, callback: (newValue: any, oldValue: any) => void): void
```
Registers a listener that fires whenever a specific key changes. This triggers on both server-side updates *and* valid client-side updates.

- **Example**:
```ts
store.onChange('class_id', (newClass, oldClass) => {
    player.sendMessage(`You switched from ${oldClass} to ${newClass}`);
});
```

## Client API

### getStore
```ts
getStore(storeName: string): ClientSharedStore
```
Accesses the local cache of a synced store. If the server hasn't created this store yet, it returns an empty container that will populate automatically when packets arrive.

- **Parameters**: 
  - `storeName`: Must match the name used on the server.
- **Returns**: `ClientSharedStore`.
- **Example**:
```ts
const stats = Moud.shared.getStore('rpg_stats');
```

### get / has
```ts
get<T>(key: string): T | undefined
has(key: string): boolean
```
Reads from the local cache. These operations are instant and do not require networking.

- **Example**:
```ts
const currentHp = stats.get<number>('health') ?? 100;
```

### set
```ts
set(key: string, value: any): boolean
```
Requests an update to a value. If the key is marked `hybrid`, the client optimistically updates its local cache and sends a packet to the server. If the key is `server_only`, this operation fails.

- **Parameters**: 
  - `key`: The entry key.
  - `value`: The new value.
- **Returns**: `boolean` (`true` if the request was sent, `false` if permission was denied).
- **Example**:
```ts
// Client toggling their own setting
const success = settings.set('auto_jump', false);
if (!success) console.log("Server locked this setting.");
```

### onChange
```ts
onChange(key: string, callback: (newValue: any, oldValue: any) => void): void
```
The core of the reactive system. Use this to bind UI elements to data. The callback fires whenever the server sends an update or the client successfully modifies a hybrid value.

- **Example**:
```ts
stats.onChange('mana', (val) => {
    manaBar.setWidth(val * 2);
});
```

### canModify
```ts
canModify(key: string): boolean
```
Checks if the server has granted write permission for this key.

- **Example**:
```ts
if (!stats.canModify('username')) {
    nameInput.setDisabled(true);
}
```

## Code Sample

```ts
// Server-side: Setup state on join
api.on('player.join', (player) => {
    const store = player.getClient().getShared().getStore('game_state');
    
    // 'score' is managed by server logic only
    store.set('score', 0, 'batched', 'server_only');
    
    // 'ready' can be toggled by the player in the lobby
    store.set('ready', false, 'immediate', 'hybrid');
});

// Client-side: UI binding
const store = Moud.shared.getStore('game_state');

store.onChange('score', (score) => {
    scoreLabel.setText(`Score: ${score}`);
});

// Allow player to click a button to toggle ready state
readyButton.onClick(() => {
    if (store.canModify('ready')) {
        store.set('ready', !store.get('ready'));
    }
});
```