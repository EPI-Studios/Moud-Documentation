# Welcome to Moud


Welcome to Moud! This guide will help you install the necessary tools to start building your project. 

The process is soo easy thanks to the Moud's CLI

## Prerequisites

Before you begin, you must have **Node.js** installed on your machine. Moud is made with recent versions of Node.js, so using version **18.x** or higher is recommended.

You can check your Node.js version with the following command:
```bash
node -v
```

```hint info Wait.. what about java?
No Need to Install Java Manually! 
The Moud CLI is designed to be as simple as possible. It will detect if you have a compatible version of Java (JDK 21) and, if not, it will offer to automatically download and install a local version used only by Moud. This means you don't have to perform any manual Java configuration!
```


## Installing the Moud CLI

The Moud CLI is a command-line tool that helps you create, develop, and package your projects. Install it globally on your system via npm :

```bash
npm install -g @epi-studio/moud-cli
```
  
Once the installation is complete, you can verify its success by checking the version:

```bash
moud --version
```

This should display the version of the CLI you just installed 

You are now ready to create your first project!