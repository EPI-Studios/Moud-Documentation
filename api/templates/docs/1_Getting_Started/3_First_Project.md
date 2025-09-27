# 3. Getting Started: Your First Project

Now that the Moud CLI is installed, let's create and run your first Moud project.

## 1. Create the Project

Open your terminal and run the CLI's `create` command:

```bash
moud create
```
  

The CLI will ask you a few questions to set up the project. To start, you can simply accept the default options.

```
? What is the name of your game? my-first-game
? Choose a project template: TypeScript (Default)`
```

The CLI will then create a new my-first-game folder with the entire base structure, configuration files, and example code.

## 2. Install Dependencies

Navigate into your new project's directory and install the development dependencies (like the TypeScript SDK) using npm.

```
cd my-first-game
```
  

## 3. Run the Development Server

The dev command is your main tool during development. It compiles your scripts, starts the Moud server, and can even watch for file changes to restart automatically.

To start the server in "watch" mode, run:

```
npm run dev -- --watch (or moud dev)
```
  

```hint tip "Why use -- --watch?"  
In npm, the first -- is used to pass arguments directly to the underlying command (in this case, moud dev). The --watch (or -w) flag enables hot-reloading. Every time you save a file in the src/, client/, or assets/ folders, the CLI will re-transpile and restart the server for you.  
```

The server will start, and you will see logs appearing in your console.

## 4. Connect to the Server

1.  **Install the Moud Client:** To connect, you need the Moud client mod for Fabric. Make sure it's in your Minecraft mods folder.
    
2.  **Launch Minecraft:** Start the game using the Fabric Loader.
    
3.  **Multiplayer:** Go to the Multiplayer menu and add a new server with the address localhost:25565 (or the port you configured).
    
4.  **Join the server!**
    

Upon connecting, you should see the welcome message defined in src/main.ts appear in the chat.

## What's Next?

Congratulations, your Moud project is up and running! You can now start modifying the src/main.ts file to change the server's logic. Try changing the welcome message or adding new commands in the player.chat event for example.
