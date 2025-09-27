# Client-Side UI System

Moud provides a powerful client-side UI system that allows you to create custom interfaces, HUDs, menus, and interactive elements. The UI is rendered on top of the game world and can be controlled from both server and client scripts.

## Understanding the UI Architecture

### Client-Side Rendering

The UI system runs entirely on the client for maximum responsiveness:

1. **Server sends UI data** via Shared Values or network events
2. **Client receives data** and creates/updates UI elements
3. **Client renders UI** over the game world
4. **User interactions** are captured and can be sent back to server

### UI Element Types

Moud supports several UI element types:

- **Text**: Display text with various styling options
- **Button**: Interactive clickable buttons
- **Input**: Text input fields
- **Container**: Layout containers for organizing other elements
- **Image**: Display textures and images

## Creating UI Elements

### Client-Side UI Creation

UI elements are created and managed in client scripts:

```typescript
// client/main.ts

// create a simple HUD element
const healthText = moudAPI.ui.createText("Health: 100/100");
healthText.setPosition(10, 10).show();

// create an interactive button
const healButton = moudAPI.ui.createButton("Heal");
healButton.setPosition(10, 50);

healButton.onClick(() => {
  moudAPI.network.sendToServer('player_heal', { type: 'button_heal' });
});

healButton.show();
```

### Server-Side UI Control via Shared Values

The most common pattern is to control UI from the server using Shared Values:

```typescript
// server/main.ts
api.on('player.join', (player) => {
  const uiStore = player.getShared().getStore('ui');
  
  // set initial UI state
  uiStore.set('health', 100);
  uiStore.set('maxHealth', 100);
  uiStore.set('mana', 50);
  uiStore.set('showHealButton', true);
});

// update UI when health changes
function damagePlayer(player: Player, damage: number) {
  const uiStore = player.getShared().getStore('ui');
  const currentHealth = uiStore.get('health') as number;
  const newHealth = Math.max(0, currentHealth - damage);
  
  uiStore.set('health', newHealth);
  
  if (newHealth <= 20) {
    uiStore.set('showHealButton', true);
  }
}
```

```typescript
// client/main.ts
const uiStore = moudAPI.shared.getStore('ui');

// react to health changes
uiStore.onChange('health', (newHealth, oldHealth) => {
  const maxHealth = uiStore.get('maxHealth') as number;
  healthText.setText(`Health: ${newHealth}/${maxHealth}`);
  
  // change color based on health
  if (newHealth <= 20) {
    healthText.setTextColor('#FF0000'); // Red
  } else if (newHealth <= 50) {
    healthText.setTextColor('#FFFF00'); // Yellow
  } else {
    healthText.setTextColor('#00FF00'); // Green
  }
});

// show/hide heal button
uiStore.onChange('showHealButton', (show) => {
  if (show) {
    healButton.show();
  } else {
    healButton.hide();
  }
});
```

## UI Element Properties and Styling

### Text Elements

```typescript
const titleText = moudAPI.ui.createText("Game Title");
titleText
  .setPosition(100, 50)
  .setTextColor('#FFFFFF')
  .setTextAlign('center')
  .show();
```

### Button Elements

```typescript
const menuButton = moudAPI.ui.createButton("Open Menu");
menuButton
  .setPosition(200, 100)
  .setSize(120, 30)
  .setBackgroundColor('#4A4A4A')
  .setBorderColor('#FFFFFF')
  .setBorderWidth(2)
  .setTextColor('#FFFFFF')
  .show();
```

### Input Elements

```typescript
const chatInput = moudAPI.ui.createInput("Type message...");
chatInput
  .setPosition(10, 400)
  .setSize(300, 25)
  .show();

chatInput.onChange((newValue, oldValue) => {
  console.log(`Input changed: ${newValue}`);
});
```

### Container Elements

```typescript
const hudContainer = moudAPI.ui.createContainer();
hudContainer
  .setPosition(10, 10)
  .setSize(200, 150)
  .setBackgroundColor('#00000080') // semi-transparent
  .show();

// add child elements to container
hudContainer.appendChild(healthText);
hudContainer.appendChild(manaText);
```

## Positioning and Layout

### Absolute Positioning

```typescript
element.setPosition(x, y);
```

### Relative Positioning

```typescript
const uiService = moudAPI.ui;

// position relative to screen
uiService.positionRelative(element, 'top-left');
uiService.positionRelative(element, 'top-right');
uiService.positionRelative(element, 'bottom-center');
uiService.positionRelative(element, 'center');

// percentage-based positioning
uiService.setPositionPercent(element, 50, 25); // 50% right, 25% down
uiService.setSizePercent(element, 30, 10);     // 30% width, 10% height
```

### Responsive Design

```typescript
function updateUILayout() {
  const screenWidth = moudAPI.ui.getScreenWidth();
  const screenHeight = moudAPI.ui.getScreenHeight();
  
  // adjust UI based on screen size
  if (screenWidth < 1024) {
    // small screen layout
    hudContainer.setSize(screenWidth - 20, 100);
  } else {
    // biggy layout
    hudContainer.setSize(300, 150);
  }
}

// update layout when screen changes
window.addEventListener('resize', updateUILayout);
```


## UI Events and Interactions

### Mouse Events

```typescript
element.onClick((element, mouseX, mouseY, button) => {
  console.log(`Clicked at ${mouseX}, ${mouseY} with button ${button}`);
});

element.onHover((element) => {
  element.setBackgroundColor('#606060'); // Hover effect
});
```

### Keyboard Events

```typescript
moudAPI.input.onKey('key.keyboard.i', (pressed) => {
  if (pressed) {
    inventoryUI.show();
  }
});

moudAPI.input.onKey('key.keyboard.escape', (pressed) => {
  if (pressed) {
    inventoryUI.hide();
  }
});
```
