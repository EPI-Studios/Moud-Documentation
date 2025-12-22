# Networking

Moud uses a custom packet protocol on top of Minecraft plugin messaging.

- Packet definitions live in `network-engine`
- Server wraps packets into a plugin message on `moud:wrapper`
- Client unwraps and dispatches to handlers
- Both sides share the same serializer

## 1. Packet definitions (`network-engine`)

Packets are Java records annotated with `@Packet` and `@Field(order = ...)`.

See `network-engine/src/main/java/com/moud/network/MoudPackets.java`.

The `order` is part of the protocol. Read and write must use the same order.

## 2. Serialization

`PacketSerializer` writes fields in order. Complex types use `TypeSerializer` implementations.

See `network-engine/src/main/java/com/moud/network/serializer/PacketSerializer.java`.

The serializer writes raw bytes only. It does not include field names.

### ByteBuffer abstraction

The serializer targets `com.moud.network.buffer.ByteBuffer`.

- Server implementation: `server/src/main/java/com/moud/server/network/MinestomByteBuffer.java` and `server/src/main/java/com/moud/server/network/InboundPacketByteBuffer.java`
- Client implementation: `client-mod/src/main/java/com/moud/client/network/buffer/FabricByteBuffer.java`

## 3. Transport (`moud:wrapper`)

The outer channel is always `moud:wrapper`. The payload contains:

- inner channel string (example: `moud:particle_batch`)
- inner packet bytes

Server code:

- `server/src/main/java/com/moud/server/network/ServerPacketWrapper.java`

Client code:

- `client-mod/src/main/java/com/moud/client/network/DataPayload.java`
- `client-mod/src/main/java/com/moud/client/network/ClientPacketReceiver.java`
- `client-mod/src/main/java/com/moud/client/network/ClientPacketWrapper.java`

## 4. Performance rules

- Batch high-frequency updates (particles, cursors) into one packet per tick when possible.
- Prefer numbers and enums over repeated strings in tick packets.
- Use `@Field(optional = true)` for nullable fields.
- Enforce limits. See `network-engine/src/main/java/com/moud/network/limits/NetworkLimits.java`.
