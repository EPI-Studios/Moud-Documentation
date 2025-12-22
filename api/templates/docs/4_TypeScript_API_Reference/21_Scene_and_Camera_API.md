# Scene and camera registry 

If you’re looking for cinematic camera control, that’s `player.camera` (server) or `Moud.camera` (client). See `docs/4_TypeScript_API_Reference/05_Input_and_Camera.md`.

## `api.scene.get()`

`api.scene.get()` returns the active scene snapshot: scene id, version, and authored objects.

```ts
const scene = await api.scene.get();

console.log(scene.id, scene.version);
for (const obj of scene.objects ?? []) {
    console.log(obj.id, obj.type, obj.properties);
}
```

## `api.scene.edit(...)`

This is mainly used by the editor/runtime to apply scene edits. You can use it if you’re building tooling that programmatically mutates the scene:

```ts
api.scene.edit({
    sceneId: 'default',
    action: 'object.update',
    payload: {
        id: 'someObjectId',
        patch: { position: { x: 0, y: 70, z: 0 } }
    }
});
```

The exact `action` strings and payload shapes depend on the editor version you’re targeting.

## `api.camera` (scene cameras)

The server keeps a registry of cameras authored in the scene editor.

```ts
const cam = api.camera.getByLabel('intro_shot');
if (cam) {
    api.server.broadcast(`camera ${cam.id} @ ${cam.position.x}, ${cam.position.y}, ${cam.position.z}`);
}
```

Assign a scene camera to a player:

```ts
const ok = api.camera.setPlayerCamera(player, 'intro_shot'); // id or label
if (!ok) player.sendMessage('Camera not found');
```

Clear it:

```ts
api.camera.clearPlayerCamera(player);
```
