
# Shared Values System

## Overview

The Shared Values System provides automatic state synchronization between server and client in Moud. This system eliminates the need for manual network packet management when updating client-side information such as health bars, mana displays, score counters, or any other dynamic data that must be reflected on the player's screen.

The system operates through named stores that hold key-value pairs. When the server modifies a value in a player's store, the client automatically receives the update and can react accordingly through registered callbacks. This architecture ensures consistent state across the network while maintaining clean separation between game logic and presentation.

## Core Concepts

### Store Architecture

Each player has access to multiple independent stores, identified by string names. A store functions as a synchronized hash map where keys are strings and values can be any JSON-serializable data type including numbers, strings, booleans, objects, and arrays.

The server acts as the authoritative source for store data. When the server updates a value, the change is transmitted to the client through the network layer. The client maintains a local cache of store values and receives delta updates rather than complete state snapshots, minimizing network overhead.

### Synchronization Modes

The system supports two synchronization modes that control when updates are transmitted to clients. The batched mode groups multiple changes occurring within the same server tick into a single network packet, reducing bandwidth usage for frequent updates. The immediate mode transmits each change as soon as it occurs, suitable for high-priority updates that require minimal latency.

### Permission Models

Store values can be configured with different permission levels that determine modification rights. The server-only permission restricts write access to the server, ensuring the client can only read values but cannot modify them. This mode is appropriate for authoritative data such as scores or health values. The hybrid permission allows both server and client to modify values, enabling optimistic updates where the client can change values immediately while the server validates and potentially overrides those changes.

### Change Listeners

The client registers callback functions that execute when specific values change. Listeners can be registered for individual keys or for any change within a store. When a value changes, the callback receives both the new value and the previous value, allowing the client to implement smooth transitions or animations based on the delta.

## Basic Usage

### Server-Side Implementation

The server accesses a player's stores through the player object and uses the set method to update values. The following example demonstrates initializing player statistics when they join the server.

```typescript
api.on('player.join', (player) => {
  const statsStore = player.getShared().getStore('playerStats');
  
  statsStore.set('health', 100);
  statsStore.set('maxHealth', 100);
  statsStore.set('mana', 50);
  statsStore.set('maxMana', 100);
  statsStore.set('experience', 0);
});

```

When game events modify player state, the server updates the corresponding store values. The client automatically receives these updates without requiring additional network code.

```typescript
function damagePlayer(player: Player, damage: number) {
  const statsStore = player.getShared().getStore('playerStats');
  const currentHealth = statsStore.get('health') as number;
  const newHealth = Math.max(0, currentHealth - damage);
  
  statsStore.set('health', newHealth);
  
  if (newHealth === 0) {
    player.sendMessage('You have been defeated!');
  }
}

function restoreMana(player: Player, amount: number) {
  const statsStore = player.getShared().getStore('playerStats');
  const currentMana = statsStore.get('mana') as number;
  const maxMana = statsStore.get('maxMana') as number;
  const newMana = Math.min(maxMana, currentMana + amount);
  
  statsStore.set('mana', newMana);
}

```

### Client-Side Implementation

The client creates UI elements and registers listeners that update those elements when store values change. This pattern separates presentation logic from game logic.

```typescript
const healthText = moudAPI.ui.createText("Health: 100/100");
healthText.setPosition(10, 10).show();

const manaText = moudAPI.ui.createText("Mana: 50/100");
manaText.setPosition(10, 30).show();

const statsStore = moudAPI.shared.getStore('playerStats');

statsStore.onChange('health', (newValue, oldValue) => {
  const maxHealth = statsStore.get('maxHealth') as number;
  healthText.setText(`Health: ${newValue}/${maxHealth}`);
  
  if (newValue < maxHealth * 0.2) {
    healthText.setTextColor('#FF0000');
  } else if (newValue < maxHealth * 0.5) {
    healthText.setTextColor('#FFAA00');
  } else {
    healthText.setTextColor('#00FF00');
  }
});

statsStore.onChange('mana', (newValue, oldValue) => {
  const maxMana = statsStore.get('maxMana') as number;
  manaText.setText(`Mana: ${newValue}/${maxMana}`);
});

```

### Synchronization Options

The server can control synchronization behavior through additional parameters to the set method. The third parameter specifies the sync mode while the fourth parameter defines the permission model.

```typescript
const statsStore = player.getShared().getStore('playerStats');

statsStore.set('score', 0, 'batched', 'server_only');
statsStore.set('criticalAlert', true, 'immediate', 'server_only');
statsStore.set('selectedSlot', 0, 'batched', 'hybrid');

```

The Shared Values system is the primary mechanism for synchronizing state between the server and the client. It is designed to be simple, efficient, and flexible.

### Server-Side API

These methods are accessed via a `Player` object, typically from a server-side event.
**Example:** `player.getShared().getStore('playerStats').set('mana', 100);`

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| **`player.getShared().getStore()`** | `storeName: string` | `Store` | Retrieves or creates a store with the specified name for the player. Store names are case-sensitive. |
| **`store.set()`** | `key: string`<br>`value: any`<br>`syncMode?: 'batched' \| 'immediate'`<br>`permission?: 'server_only' \| 'hybrid'` | `void` | Sets a value in the store and synchronizes it to the client. Accepts any JSON-serializable data type. Defaults to `batched` sync and `hybrid` permission. |
| **`store.get()`** | `key: string` | `any` | Retrieves the current value associated with the specified key. Returns `undefined` if the key does not exist. |
| **`store.has()`** | `key: string` | `boolean` | Checks whether the specified key exists in the store. |
| **`store.remove()`** | `key: string` | `void` | Removes the specified key from the store and synchronizes the deletion to the client. |

### Client-Side API

These methods are accessed via the global `Moud` object in a client-side script.
**Example:** `Moud.shared.getStore('playerStats').onChange('mana', (newMana) => { ... });`

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| **`Moud.shared.getStore()`** | `storeName: string` | `ClientStore` | Retrieves a reference to the client-side store with the specified name. The store must be initialized by the server. |
| **`clientStore.get()`** | `key: string` | `any` | Retrieves the current cached value for the specified key. Returns `undefined` if the key does not exist or has not yet been synchronized. |
| **`clientStore.has()`** | `key: string` | `boolean` | Checks whether the specified key exists in the client's cached store data. |
| **`clientStore.onChange()`** | `key: string`<br>`callback: (newValue: any, oldValue: any) => void` | `void` | Registers a callback function that executes when the value of a **specific key** changes. Receives the new and old values. |
| **`clientStore.on()`** | `event: 'change'`<br>`callback: (key: string, newValue: any, oldValue: any) => void` | `void` | Registers a callback that executes when **any value** in the store changes. Receives the key name, new value, and old value. |
| **`clientStore.set()`** | `key: string`<br>`value: any` | `boolean` | Attempts to modify a value from the client side. Only succeeds if the key was set with `hybrid` permission on the server. Returns `true` if the update request was sent, `false` otherwise. |
| **`clientStore.canModify()`**| `key: string` | `boolean` | Checks whether the client has permission to modify the specified key. Returns `true` only for keys with `hybrid` permission. |