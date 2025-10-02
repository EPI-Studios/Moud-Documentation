
# The UI System

Moud includes a client-side UI system designed to feel familiar to web developers. It allows you to create custom interfaces, HUDs, menus, and interactive elements using a component-based, declarative API.

## Core Concepts

The UI system is built on a clear architectural separation: **state is managed by the server, while rendering and interaction are handled by the client.**

### Client-Side Authority

All UI elements are created and rendered exclusively on the client. This ensures that interfaces are perfectly smooth and responsive, running at the player's native frame rate without any network latency. Animations, hover effects, and input validation happen instantly.

### The Role of the Server

The server's job is not to draw the UI, but to provide the **data** that the UI displays. It acts as the single source of truth for the game state. For example, the server manages the player's health value; the client's UI simply reads that value and displays it.

## Building a Simple HUD

Let's build a practical example: a custom mana bar for a player.

#### Server-Side Logic
The server is responsible for managing the `mana` and `maxMana` values.

```typescript
api.on('player.join', (player) => {
  const uiStore = player.shared.getStore('playerUI');

  uiStore.set('mana', 80);
  uiStore.set('maxMana', 100);
});

function castSpell(player: Player) {
    const uiStore = player.shared.getStore('playerUI');
    const currentMana = uiStore.get('mana') as number;

    if (currentMana >= 10) {
     
        uiStore.set('mana', currentMana - 10);
    }
}
```

#### Client-Side Rendering

The client is responsible for creating the UI elements and updating them when the server's data changes.

```typescript
const hudContainer = Moud.ui.createContainer()
    .setPos(10, 10)
    .setSize(150, 20)
    .setBackgroundColor("#00000088")
    .setBorder(1, "#FFFFFF22");

const manaBarBg = Moud.ui.createContainer()
    .setPos(12, 12)
    .setSize(146, 16)
    .setBackgroundColor("#555555");
const manaBarFg = Moud.ui.createContainer()
    .setPos(12, 12)
    .setSize(146, 16)
    .setBackgroundColor("#3B82F6"); 

const manaText = Moud.ui.createText("Mana: 80 / 100")
    .setPos(15, 14)
    .setTextColor("#FFFFFF");
hudContainer.appendChild(manaBarBg);
hudContainer.appendChild(manaBarFg);
hudContainer.appendChild(manaText);
hudContainer.showAsOverlay();

const uiStore = Moud.shared.getStore('playerUI');

function updateManaBar() {
    const mana = uiStore.get('mana') as number ?? 0;
    const maxMana = uiStore.get('maxMana') as number ?? 100;

    const fillPercentage = maxMana > 0 ? mana / maxMana : 0;
    manaBarFg.setWidth(146 * fillPercentage);
    manaText.setText(`Mana: ${mana} / ${maxMana}`);
}

uiStore.onChange('mana', updateManaBar);
uiStore.onChange('maxMana', updateManaBar);
updateManaBar();
```

## Component Reference

### Containers (`createContainer`)
Containers are the building blocks for layout. They can hold other elements and arrange them using a flexbox-like system.

```typescript
const panel = Moud.ui.createContainer()
  .setFlexDirection('column') // 'row' or 'column'
  .setAlignItems('center')    // 'flex-start', 'center', 'flex-end', 'stretch'
  .setJustifyContent('center')// 'flex-start', 'center', 'flex-end', 'space-between'
  .setGap(8)                  // space between children
  .setPadding(10, 10, 10, 10);
```

### Text (`createText`)
Used for displaying text.

```typescript
const label = Moud.ui.createText("Hello, World!")
  .setTextColor('#FFFFFF')
  .setTextAlign('center'); // 'left', 'center', 'right'
```

### Buttons (`createButton`)
Simple, clickable text buttons.

```typescript
const myButton = Moud.ui.createButton("Click Me");
myButton.onClick(() => {
  console.log("Button was clicked!");
  // send an event to the server
  Moud.network.sendToServer('my_button_clicked', {});
});
```

### Images (`createImage`)
Displays a texture from the game's assets. The source path follows Minecraft's resource location format.

```typescript
const icon = Moud.ui.createImage("minecraft:textures/item/diamond.png")
  .setSize(32, 32);
```

### Inputs (`createInput`)
Text input fields for user entry.

```typescript
const nameInput = Moud.ui.createInput("Enter your name");

nameInput.onChange((component, newValue, oldValue) => {
  console.log(`Text changed to: ${newValue}`);
});

nameInput.onSubmit((component, submittedValue) => {
  console.log(`Submitted: ${submittedValue}`);
  // e.g., send the name to the server
});
```

## Layout and Styling

All elements share a common set of methods for styling and positioning.

| Method | Description |
| :--- | :--- |
| `setPos(x, y)` | Sets the absolute top-left position on the screen. |
| `setSize(width, height)` | Sets the dimensions of the element. |
| `setBackgroundColor(hex)` | Sets the background color (e.g., `'#FF000088'` for semi-transparent red). |
| `setBorder(width, hex)` | Adds a border around the element. |
| `setOpacity(value)` | Sets the overall opacity from 0.0 (invisible) to 1.0 (fully visible). |
| `showAsOverlay()` | Adds the element to the screen. |
| `hideOverlay()` | Hides the element. This simply sets its `visible` flag to `false`. |

## Responding to Window Resizing

To create responsive UIs that adapt to different screen sizes, listen to the `render:resize` event.

```typescript
function layoutMyUI() {
    const screenWidth = Moud.ui.getScreenWidth();
    const screenHeight = Moud.ui.getScreenHeight();

    // center the main panel on the screen
    const panelWidth = mainPanel.getWidth();
    mainPanel.setPos(screenWidth / 2 - panelWidth / 2, 50);
}

// run layout once on startup
layoutMyUI();

// and re-run it every time the window size changes
Moud.events.on('render:resize', layoutMyUI);
```
