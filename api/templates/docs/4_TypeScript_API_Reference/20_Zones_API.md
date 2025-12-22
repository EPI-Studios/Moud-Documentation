# Zones

Zones are server-side trigger volumes: when a player enters/leaves an axis-aligned box, your callbacks fire.

## Create a zone

```ts
api.zones.create(
    'lobby',
    api.math.vector3(0, 64, 0),
    api.math.vector3(12, 72, 12),
    {
        onEnter: (player, zoneId) => player.sendMessage(`entered ${zoneId}`),
        onLeave: (player, zoneId) => player.sendMessage(`left ${zoneId}`)
    }
);
```

## Update callbacks

```ts
api.zones.setCallbacks('lobby', {
    onEnter: (player) => player.sendMessage('welcome back'),
    onLeave: undefined
});
```

## Remove

```ts
api.zones.remove('lobby');
```

## Notes

- Zones are axis-aligned (no rotation).
- Overlapping zones all fire; it’s up to you to decide how to combine effects.
