# Your First Project

Let's go from an empty folder to a running game loop that you can join with the Fabric mod. The steps below mirror what happens inside the `example/ts` project that ships with the repository.

## 1. Scaffold

```bash
moud create
```

Answer the prompts:

```
? What is the name of your game? my-first-game
? Choose a project template: TypeScript (Default)
```

This generates:

- `src/main.ts` – server entry point preloaded with sample logic.
- `client/` – placeholder folder for optional client scripts.
- `assets/` – drop textures, models (`.obj/.gltf`), shaders (`.glsl`), sounds, and animation JSON.
- `package.json`, `tsconfig.json`, `.gitignore`, and the CLI scripts discussed earlier.

## 2. Install Dependencies

Inside the new directory:

```bash
cd my-first-game
pnpm install        # or npm install / yarn
```

This installs the SDK typings plus TypeScript. No runtime dependencies are required because the server bundles Graal/Minestom internally.

## 3. Launch the Dev Server

```bash
npm run dev -- --watch   # alias for `moud dev --watch`
```

What happens under the hood:

1. **Environment bootstrap** – downloads Java 21 and the latest `moud-server.jar` into `~/.moud` if missing.
2. **Transpile** – runs esbuild on `src/main.ts` and any client scripts, saving them in `.moud/cache`.
3. **Start Minestom** – launches the Java server with your project root, enables hot reload, opens port `25565`, and exposes an HTTP endpoint on `port+1000` for reload requests.
4. **Watch** – chokidar watches `src/`, `client/`, and `assets/`. Saving a file triggers `Transpiler.transpileProject()` and hits the hot-reload endpoint; no restart needed.

```hint tip Hot reload visibility
`moud dev` prints the reload hash each time it rebuilds. If you see `Server responded with status 200`, the Graal runtime swapped your scripts without disconnecting players.
```

## 5. Edit Something

Open `src/main.ts` and tweak one of the demo hooks, for example, add a simple chat event test:

```ts
api.on('player.chat', (event) => {
  const player = event.getPlayer();
  const message = event.getMessage().trim();

  if (message === 'hello') {
    event.cancel();
    player.sendMessage('Welcome vro');
  }
});
```

Save the file. The CLI recompiles, sends a new bundle, and the running client updates instantly. 


## 6. Build for Distribution

When you're ready to share a build:

```bash
npm run build   # -> moud pack
```

`moud pack` runs the transpiler in production mode, copies assets, embeds the latest `moud-server.jar`, and writes a zipped folder under `dist/`. Players can unzip it and run `run.sh` / `run.bat` to host your experience without installing Node or the CLI.
