# Assets and Resource Flow

Moud ships your project assets to clients as a Minecraft resource pack. This is how textures, UI atlases, shaders, and sounds become available to the client mod.

This page describes the runtime path: project folders, zip, HTTP, client apply, resource lookups.

## 1. Where assets come from

The server builds the pack from these folders (when they exist):

- `<project>/assets`
- `<project>/client/assets`
- `<project>/packages/**/assets`

See `server/src/main/java/com/moud/server/network/ResourcePackBuilder.java`.

## 2. Packaging (server)

`ResourcePackBuilder.buildFromProjectAssets()` writes a zip to `.moud/cache/moud-resourcepack.zip` and adds `pack.mcmeta`.

All files are written under `assets/<namespace>/...` inside the zip. If you have `.ogg` sounds but no `sounds.json`, the builder generates one per namespace.

## 3. Hosting and push (server)

`ResourcePackServer` starts an embedded HTTP server and exposes the zip at a versioned URL (SHA-1 in the path).

`ServerNetworkManager` pushes that URL to clients using `ResourcePackPushPacket` and requires it. If the pack is declined or fails to apply, the player is kicked.

Relevant code:

- `server/src/main/java/com/moud/server/network/ResourcePackServer.java`
- `server/src/main/java/com/moud/server/network/ServerNetworkManager.java`

## 4. Client lookups

Once Minecraft applies the pack, resources are available through the normal resource manager.

Any code that uses a namespaced id like `moud:textures/ui/icon.png` is just asking Minecraft for that resource.

Examples in Moud:

- UI images and atlases: `client-mod/src/main/java/com/moud/client/ui/component/UIImage.java` and `client-mod/src/main/java/com/moud/client/ui/atlas/UITextureAtlasManager.java`
- Post effects (Veil pipelines): `client-mod/src/main/java/com/moud/client/rendering/PostProcessingManager.java`
- Display textures (including `moud:fbo/...`): `client-mod/src/main/java/com/moud/client/display/DisplayTextureResolver.java`

## 5. Concrete example (post effect)

A server plugin can apply an effect by id:

`context.rendering().applyPostEffect("moud:my_effect")`

On the client, `PostProcessingManager.applyEffect` forwards that id to Veil's post-processing manager. If the referenced resources are missing from the pack, Veil logs an error and nothing is applied.
