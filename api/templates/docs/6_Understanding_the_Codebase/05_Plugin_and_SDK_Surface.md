# Plugin and SDK Surface

Moud is split into internal engine modules and stable public surfaces.

Internal modules change often:

- `server` (Minestom runtime, managers, networking integration)
- `client-mod` (Fabric client, Veil integration)
- `network-engine` (packet definitions and serializers)

Public surfaces are intended for users:

- Java plugins: `plugin-api`
- TypeScript scripts: `packages/sdk`

If a feature is only implemented internally, it is not usable from plugins or scripts.

## Java plugin API (`plugin-api`)

`plugin-api` exposes services as interfaces and keeps data types simple.

- Prefer records and small DTOs.
- Avoid depending on `server` internals.
- Keep Minestom types out of the API where possible.

Example:

```java
public interface LightingService {
    LightHandle create(PointLightDefinition definition);
}
```

Plugins get services from `PluginContext` (for example `context.lighting()`).

## Server implementations (`server`)

Each `plugin-api` service is implemented in the server module.

- Implementations: `server/src/main/java/com/moud/server/plugin/impl`
- Wiring: `server/src/main/java/com/moud/server/plugin/context/PluginContextImpl.java`

The implementation converts API types to internal managers and sends packets when needed.

## TypeScript SDK (`packages/sdk`)

Scripts talk to GraalVM proxies on the server and services on the client.

- Server global: `api`
- Client global: `Moud`
- Types: `packages/sdk/src/index.ts`

When you add or change a JS-visible method, update the proxy/service and the TypeScript type together.

## Keeping things in sync

When a public surface changes:

- Update `plugin-api` and its server implementation together.
- Update `packages/sdk/src/index.ts` so scripts get types and autocomplete.
- Rebuild the SDK package so `dist/` matches the new types.
