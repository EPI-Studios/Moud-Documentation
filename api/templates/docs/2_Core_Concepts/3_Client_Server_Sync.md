Client-Server Synchronization

In a client-server architecture, maintaining a consistent state (e.g., a player's health, inventory contents, UI state) is a major challenge. Moud solves this problem with a powerful yet simple system called **Shared Values**.

## The Problem: Keeping the Client Updated

Imagine your player has a "mana" bar. The mana value is managed by the server, but the mana bar is displayed by the client. How does the client know when and how to update the bar?

Moud's solution is to "share" the mana value between the server and the client.

## The Shared Values System

The Shared Values system allows you to create named key-value data "stores" that are automatically synchronized with a specific client.

### Server-Side: Setting a Value

On the server, you access a player's stores via `player.getShared()`.

```typescript
// src/main.ts

api.on('player.join', (player) => {
  //get or create a store named 'playerStats' for this player
  const statsStore = player.getShared().getStore('playerStats');

  // set the 'mana' value. The client will be automatically notified.
  statsStore.set('mana', 100);
  statsStore.set('maxMana', 100);
});

// imagine a spell costs 10 mana
function castSpell(player: Player) {
    const statsStore = player.getShared().getStore('playerStats');
    const currentMana = statsStore.get('mana') as number;

    if (currentMana >= 10) {
        statsStore.set('mana', currentMana - 10);
    }
}
```
  

### Client-Side: Listening for Changes

On the client, you can listen for changes to a specific key and react accordingly, such as by updating a UI element.

```typescript
// client/main.ts

// create a text element to display mana
const manaText = moudAPI.ui.createText("Mana: 100/100");
manaText.setPosition(10, 10).show();

// access the same 'playerStats' store
const statsStore = moudAPI.shared.getStore('playerStats');

// register a callback that will fire ONLY if the 'mana' value changes
statsStore.onChange('mana', (newValue, oldValue) => {
  console.log(`Mana changed from ${oldValue} to ${newValue}`);
  
  // get the maxMana value for display
  const maxMana = statsStore.get('maxMana') as number;
  
  // update the UI text
  manaText.setText(`Mana: ${newValue}/${maxMana}`);
});
```
  
### Synchronization Options

The store.set() method can take optional arguments for finer control:

-   **syncMode**:
    
    -   'batched' (default): Groups multiple changes that occur in the same tick into a single network packet. This is the most efficient option.
        
    -   'immediate': Sends a packet instantly for this specific change. Use for high-priority updates.
        
-   **permission**:
    
    -   'hybrid' (default): Both the server and client can modify the value.
        
    -   'server_only' or 'client_readonly': Only the server can modify the value. The client receives updates but cannot change it.
        

```typescript
// The score can only be modified by the server
statsStore.set('score', 0, 'batched', 'server_only');`
```