# 2. Getting Started: Project Configuration

Every Moud project is configured through a standa file from the Node.js ecosystem: `package.json`. This file contains essential information about your game, its dependencies, and scripts to manage it.

When you create a new project with `moud create`, a `package.json` file is automatically generated for you. Here is a breakdown of its most important sections.

## `package.json` Structure

```json
{
  "name": "my-awesome-game",
  "version": "1.0.0",
  "description": "A Moud game: my-awesome-game",
  "moud:main": "src/main.ts",
  "scripts": {
    "dev": "moud dev",
    "build": "moud pack"
  },
  "devDependencies": {
    "@epi-studio/moud-sdk": "^0.1.2-alpha",
    "@epi-studio/moud-cli": "^0.1.6",
    "typescript": "^5.0.0"
  }
}
 ``` 

### Key Fields

-   **name, version, description**  
    These fields describe your project. The name will be used when packaging your project for distribution.
    
-   **"moud:main"**  
    ``` hint warning "Essential Field"  
    This is a Moud-specific field. It tells the Moud Engine which file is the entry point for your **server-side** game logic. By default, this is src/main.ts.  
    ```
    
-   **"scripts"**  
    
    -   "dev": Starts the development server. You can run it with npm run dev (with hot reloading).
        
    -   "build": Packages your project for distribution. You can run it with npm run build.
        
-   **"devDependencies"**  
    These are the tools required for developing your game:
    
    -   @epi-studio/moud-cli: The Moud CLI, listed here for reference.
        
    -   @epi-studio/moud-sdk: The Software Development Kit (SDK). This package is crucial as it provides all the TypeScript type definitions for the Moud API.
    -   typescript: The TypeScript compiler.
        

```hint warning "The Importance of the SDK"  
The @epi-studio/moud-sdk package contains no executable logic, but it is indispensable for development. It enables your code editor (like VS Code) to provide autocompletion, type-checking, and inline documentation for the entire API, including api, Player, Vector3, etc.  
```