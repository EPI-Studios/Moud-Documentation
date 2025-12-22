# UI Management

Overlay and component APIs provided by `Moud.ui`. This service allows you to build lightweight HUDs and menus directly on the client without HTML or CSS.

## Screen and Metrics

### getScreenWidth / getScreenHeight
```ts
getScreenWidth(): number
getScreenHeight(): number
```
Returns the current dimensions of the game window in "scaled pixels." These values match the coordinate system used for rendering and mouse events.

- **Parameters**: None.
- **Returns**: `number`.
- **Example**:
```ts
const centerX = Moud.ui.getScreenWidth() / 2;
const bottomY = Moud.ui.getScreenHeight() - 50;
```

### getMouseX / getMouseY
```ts
getMouseX(): number
getMouseY(): number
```
Returns the current mouse cursor position in scaled UI coordinates.

- **Parameters**: None.
- **Returns**: `number`.
- **Example**:
```ts
const mx = Moud.ui.getMouseX();
const my = Moud.ui.getMouseY();
```

### getTextWidth
```ts
getTextWidth(text: string): number
```
Calculates the width of a string using the default Minecraft font renderer.

- **Parameters**: 
  - `text`: The string to measure.
- **Returns**: `number`.
- **Example**:
```ts
const width = Moud.ui.getTextWidth("Hello World");
container.setWidth(width + 20);
```

### onResize
```ts
onResize(callback: (width: number, height: number) => void): void
```
Registers a listener that triggers whenever the game window is resized. Use this to update the positions of anchored UI elements.

- **Parameters**: 
  - `callback`: Function receiving the new width and height.
- **Returns**: `void`.
- **Example**:
```ts
Moud.ui.onResize((w, h) => {
    hud.setPos(w - 200, 10);
});
```

```hint tip Resize Events
Resize events are deferred if the client context is still loading, then replayed once ready, so you still receive the latest size after a freeze/reload.
```


## Component Factory

### createContainer
```ts
createContainer(): UIContainer
```
Creates a container element that acts like a flexbox div. It supports automatic layout of child elements.

- **Parameters**: None.
- **Returns**: `UIContainer`.
- **Example**:
```ts
const box = Moud.ui.createContainer()
    .setFlexDirection('column')
    .setGap(5)
    .setBackgroundColor('#00000088');
```
If you want to position children manually (no flex layout updates), call `box.setManualLayout(true)`.

### createText
```ts
createText(content: string): UIText
```
Creates a text label.

- **Parameters**: 
  - `content`: The initial text string.
- **Returns**: `UIText`.
- **Example**:
```ts
const label = Moud.ui.createText("Score: 0").setTextColor('#FFFF00');
```

### createButton
```ts
createButton(label: string): UIButton
```
Creates a clickable button with default styling.

- **Parameters**: 
  - `label`: The text on the button.
- **Returns**: `UIButton`.
- **Example**:
```ts
const btn = Moud.ui.createButton("Submit")
    .onClick(() => console.log("Clicked!"));
```

### createInput
```ts
createInput(placeholder: string): UIInput
```
Creates a text input field.

- **Parameters**: 
  - `placeholder`: Text shown when the field is empty.
- **Returns**: `UIInput`.
- **Example**:
```ts
const input = Moud.ui.createInput("Enter name...");
input.onSubmit((val) => console.log("Submitted:", val));
```

### createImage
```ts
createImage(source: string): UIImage
```
Creates an image element using a texture path.

- **Parameters**: 
  - `source`: Namespaced texture path (e.g., `moud:textures/icon.png`).
- **Returns**: `UIImage`.
- **Example**:
```ts
const icon = Moud.ui.createImage("minecraft:textures/item/diamond.png")
    .setSize(32, 32);
```

## Image Atlases

`UIImage` can render a named region from a texture atlas XML.

### image.setAtlasRegion

```ts
setAtlasRegion(atlasPath: string, subTextureName: string): this
```

Selects a `SubTexture` from `atlasPath` and updates the image to render only that region.

- `atlasPath`: namespaced path to the atlas XML (example: `moud:textures/ui/atlas.xml`)
- `subTextureName`: the `name="..."` inside the XML

* **Example**:

```ts
const play = Moud.ui.createImage("moud:textures/ui/atlas.png")
    .setAtlasRegion("moud:textures/ui/atlas.xml", "play")
    .showAsOverlay();
```

Atlas XML format:

```xml
<TextureAtlas imagePath="atlas.png">
  <SubTexture name="play" x="0" y="0" width="32" height="32"/>
  <SubTexture name="pause" x="32" y="0" width="32" height="32"/>
</TextureAtlas>
```

Notes:

- Put the atlas files under `assets/<namespace>/textures/...` so they ship to clients.
- `imagePath` can be relative (resolved next to the XML) or a full namespaced id.
- `frameX/frameY/frameWidth/frameHeight` are optional for trimmed sprites (defaults to `width/height`).
- `setAtlasRegion(...)` sets the component size to the frame size. Override with `setSize(...)` if needed.

## Component Methods

All UI components (`UIText`, `UIButton`, etc.) inherit these common methods for positioning, styling, and interaction.

### Layout & Styling
```ts
setPos(x: number, y: number): this
setSize(width: number, height: number): this
setBackgroundColor(color: string): this // Hex string like "#RRGGBBAA"
setBackgroundTexture(textureId: string): this // e.g., "minecraft:textures/gui/widgets.png"
setTextColor(color: string): this
setTextAlign(align: string): this // "left" | "center" | "right"
setOpacity(alpha: number): this
setZIndex(z: number): this // higher renders on top
setPadding(top: number, right: number, bottom: number, left: number): this
setBorder(width: number, color: string): this
setFullscreen(enabled: boolean): this // stretch to full screen
setComponentId(id: string): this // override auto-generated id
```

### Hierarchy & Visibility
```ts
appendChild(child: UIComponent): this
removeChild(child: UIComponent): this
showAsOverlay(): this // Mounts the component to the screen
hideOverlay(): this // Unmounts the component
```

### Events
```ts
onClick(callback: (component: UIComponent, mouseX: number, mouseY: number, button: number) => void): this
onHover(callback: (component: UIComponent, ...args: unknown[]) => void): this
onUnhover(callback: (component: UIComponent, ...args: unknown[]) => void): this
onFocus(callback: (component: UIComponent) => void): this
onBlur(callback: (component: UIComponent) => void): this
```

### Animation
```ts
animate(options: { x?: number; y?: number; width?: number; height?: number; opacity?: number; duration?: number; easing?: string; onComplete?: () => void }): this
```
Interpolates position/size/opacity over time.

## Code Example
```ts
const container = Moud.ui.createContainer()
    .setPos(10, 10)
    .setSize(200, 100)
    .setBackgroundColor('#000000AA')
    .setPadding(10, 10, 10, 10)
    .showAsOverlay();

const title = Moud.ui.createText("Main Menu");
const startBtn = Moud.ui.createButton("Start Game");

startBtn.onClick(() => {
    Moud.network.sendToServer("game:start");
    container.hideOverlay();
});

container.appendChild(title);
container.appendChild(startBtn);

// make it semi-transparent with a border and custom id
container
    .setOpacity(0.9)
    .setBorder(1, "#FFFFFFAA")
    .setComponentId("main-menu");
```
