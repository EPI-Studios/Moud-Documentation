# Installing Moud
Moud is a TypeScript-first Minecraft framework. Everything like server scripts, client rendering, UI, audio, and tooling. It runs on top of a small stack:

- **Node.js** for authoring and bundling TypeScript.
- **The Moud CLI** for scaffolding, development servers, hot reload, and packaging.
- **The Java server** (Minestom + GraalVM) launched by the CLI.
- **The Fabric client mod** that executes client-side scripts and rendering code.

This page walks through setting up each piece so you start your project in a minute.

## 1. System Requirements

| Component | Requirement | Notes |
| --- | --- | --- |
| Node.js | v18.x or newer | Needed for the CLI/transpiler. `node -v` should report ≥ 18. |
| npm/pnpm | latest LTS | Any package manager works; the repo uses pnpm internally. |
| Git | optional but recommended | Every template is a Git project. |
| Disk space | ~3 GB | CLI caches the Java runtime, server jars, and bundles under `~/.moud`. |
| Minecraft | 1.21.1 + Fabric Loader | Required to run the client mod. |

`moud dev` launches a Java 21 Minestom server automatically. If Java 21 is missing, the CLI download and sandbox a compatible JDK just for Moud.

```hint info Java is handled for you
The CLI checks for JDK 21. If it is missing or incompatible, it prompts you once and installs a private copy under `~/.moud/jdks/<version>` so you never have to touch JAVA_HOME.
```

## 2. Install the CLI

Install the latest CLI globally (npm shown, but pnpm/yarn work too):

```bash
npm install -g @epi-studio/moud-cli@latest
```

Verify the install:

```bash
moud --version
moud --help
```

If the CLI runs, the bundled dependencies (commander, esbuild, Graal bindings, etc.) are ready. All future docs assume `moud` is on your PATH.

## 3. Install the Fabric Client Mod

1. Install **Fabric Loader 0.15+** for Minecraft 1.21.1.
2. Download the `client-mod` build (or build it yourself with `./gradlew :client-mod:build` inside the repo) or from the modrinth page.
3. Drop `moud-client-mod.jar` into your `.minecraft/mods` folder alongside Fabric API.

When you connect to a `moud dev` server, the Fabric mod handles:
- Running the GraalVM client runtime.
- Receiving scripted bundles from the server.
- Rendering UI, models, lights, cameras, etc.

## 4. Test the Environment

Run the CLI once in any folder to confirm dependencies resolve:

```bash
moud create 
moud dev 
```

Expected behaviour:
- The first `moud dev` invocation will create `~/.moud`, download Java 21, fetch the latest `moud-server.jar`, then keep those binaries cached.
- Gson, GraalVM, and the Fabric dependencies are baked into the server jar, so no additional setup is required.

```hint tip Update cadence
Run `npm install -g @epi-studio/moud-cli@latest` from time to time. The `VersionManager` inside the CLI warns you at runtime if a newer CLI or engine build is available.
```

You are now ready to scaffold a project (`moud create`) and launch it with `moud dev`. The next chapters cover project structure, configuration, and day-to-day workflow.
