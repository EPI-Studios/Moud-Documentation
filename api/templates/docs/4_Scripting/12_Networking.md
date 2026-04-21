# Networking

The `node.net` API handles asynchronous, bi-directional messaging between server and client scripts attached to a specific scene node. It is intended for discrete remote procedure calls (RPCs), input triggers, and localized visual feedback. Continuous state synchronization should utilize the property replication system instead.

---

## API reference

The engine automatically serializes and deserializes message payloads into native objects and tables via a binary codec. Manual buffer management is not required.

Syntax varies by execution environment:

| Execution side | Language | Access syntax |
|---|---|---|
| Server script | Luau | `api:node():net():on(...)` / `api:node():net():sendTo(...)` |
| Server script | TypeScript | `node.net.on(...)` / `node.net.sendTo(...)` |
| Client script | Luau | `node.net:on(...)` / `node.net:send(...)` |
| Client script | TypeScript | `node.net.on(...)` / `node.net.send(...)` |

### Server methods

| Method | Description |
|---|---|
| `on(topic: string, schema: table, handler: function)` | Registers a listener for inbound messages on a specific topic. Requires a schema table for payload validation. |
| `sendTo(uuid: string, topic: string, payload: any, opts?: table)` | Transmits a message to a specific connected client. |
| `broadcast(topic: string, payload: any, opts?: table)` | Transmits a message to all connected clients in the current scene. |
| `clear(topic: string)` | Deallocates a previously registered listener. |

### Client methods

| Method | Description |
|---|---|
| `on(topic: string, handler: function)` | Registers a listener for inbound messages on a specific topic from the server. |
| `send(topic: string, payload: any, opts?: table)` | Transmits a message to the server-side script attached to the same node. |
| `clear(topic: string)` | Deallocates a previously registered listener. |

---

## Payload configuration

### Data types and limitations
The `payload` parameter accepts the following native types: `nil`, `boolean`, `number`, `string`, `array`, `table`, and byte-strings. 

*   **Size limit:** The maximum payload size is **1024 bytes** per message. Payloads exceeding this limit must be manually chunked or integrated into property replication.

### Delivery options (`opts`)
The `opts` table currently supports a single configuration flag:

*   `reliable` *(boolean, default: `true`)*: 
    *   If `true`, the engine guarantees ordered delivery over TCP-equivalent channels. Recommended for critical game actions, transactions, and state changes.
    *   If `false`, the engine utilizes lowest-latency UDP-equivalent channels. Packets may drop during network congestion. Recommended for non-critical visual effects (e.g., hit flashes, particle hints).

---

## Schema validation (Server)

Server `on()` methods require a schema table to map payload keys to specific data types and prevent malformed packets.

**Accepted schema types:** `"number"`, `"integer"`, `"string"`, `"boolean"`, `"table"`, `"array"`.

Validation executes on the engine's network thread before reaching the script VM. 
*   If a payload is missing a required field or contains a mismatched data type, the packet is silently dropped. 
*   Unmapped fields within the payload are permitted but ignored by the validator.

```ts
// The handler will only execute if payload.targetId is a valid integer.
node.net.on("attack", { targetId: "integer" }, (playerUuid, payload) => {
    // Execution logic
});
```

---

## Security and execution limits

### Node authority and ownership

Clients can only transmit messages to nodes they own. Ownership is evaluated by checking specific node properties against the sender's client UUID. The engine checks properties in the following priority order:

1.  `owner_uuid`
2.  `@owner`
3.  `owner`

If a property matches the sender's UUID, the packet is accepted. If the property exists but contains a mismatched UUID, the packet is silently dropped. If none of these properties exist, the node defaults to public, and any client may transmit to it.

### Rate limiting

The engine enforces a token bucket rate limit per `(player_uuid, topic)` pair. 
*   **Default limit:** 20 messages per second.
*   **Burst capacity:** 40 messages.

Packets exceeding this threshold are silently dropped. Limits reset automatically upon client disconnection.

### Lifecycle memory management

Network handlers are bound to their parent node's lifecycle. When a node is freed, its script is disposed, or the scene terminates, the engine automatically unregisters and deallocates all associated `node.net` handlers.
