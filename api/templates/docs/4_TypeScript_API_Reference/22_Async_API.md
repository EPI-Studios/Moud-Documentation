# Async 

`api.async` is the server-side helper for doing heavy work off the main thread.

Use it when you want to:

- generate or parse big data without lagging ticks
- run expensive math/pathfinding
- do CPU-heavy preprocessing before applying results on the server thread

## submit

`submit` runs a function on a worker thread and gives you a Promise back.

```ts
api.on('player.chat', async (event) => {
    const player = event.getPlayer();
    if (event.getMessage() !== '!heavy') return;
    event.cancel();

    const result = await api.async.submit(() => {
        // Do expensive work here (no Minestom calls)
        let sum = 0;
        for (let i = 0; i < 5_000_000; i++) sum += i;
        return sum;
    });

    api.async.runOnServerThread(() => {
        player.sendMessage(`done: ${result}`);
    });
});
```

## runOnServerThread

Use this when you’re inside an async task (or any other thread) and you need to touch game state safely:

```ts
api.async.runOnServerThread(() => {
    api.world.setBlock(0, 64, 0, 'minecraft:gold_block');
});
```

## Rule of thumb

If it touches Minestom or world state, keep it on the server thread. If it’s pure computation, move it into `submit`.
