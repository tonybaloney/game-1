# Student Guide

This game already works, so your job is to make it yours.

## First Playtest

Open the game and try the starter level.

- Move with A/D or the arrow keys.
- Jump with W, Up, or Space.
- Collect coins.
- Avoid spikes and enemies.
- Reach the flag.

## Make A Level

1. Open the Designer tab.
2. Pick a brush.
3. Drag on the map to paint tiles or place objects.
4. Use the scroll bar to move across the whole level.
5. Press Save.
6. Press Try Level.

Good level design is not just making things hard. Try making a level that teaches one idea, then asks the player to use it in a harder way.

## Make A Sprite

1. Open the Sprites tab.
2. Choose a sprite.
3. Pick a color.
4. Paint pixels.
5. Press Save Sprites.
6. Go back to Play and check it out.

## Build Your Game Data

When your level and sprites feel ready, go to Play, name your game, and press Build Game Data. That makes one file with your levels and art together.

If the game was started with `node tools/dev-server.js`, the file is saved into the project automatically. If not, your browser downloads the file instead.

## Programming Quests

Open `js/student-challenges.js`. Try one quest at a time.

### Quest 1: Change The Feel

Change these numbers:

- `maxRunSpeed`
- `jumpVelocity`
- `gravity`

Then playtest. Write down which values feel best.

### Quest 2: Add Double Jump

Change:

```javascript
airJumps: 0
```

to:

```javascript
airJumps: 1
```

Now design a level that needs double jump.

### Quest 3: Make Coins More Important

Change `coinValue`. Try `50`. Does that make collecting coins feel better?

### Quest 4: Lock The Goal

Change:

```javascript
requireAllCoinsForGoal: false
```

to:

```javascript
requireAllCoinsForGoal: true
```

Now the player must collect every coin before the flag works.

### Quest 5: Tune Enemies

Change `enemyPatrolSpeed`. If enemies move too fast, the game feels unfair. If they move too slowly, they may be boring.

### Quest 6: Change Player Art

Find:

```javascript
playerSprite: "player"
```

Try:

```javascript
playerSprite: "playerComet"
```

Then try `"playerBoulder"`. This only changes the picture. If the character should feel different too, change the movement numbers near it, like `maxRunSpeed`, `jumpVelocity`, or `gravity`.

### Quest 7: Change Movement Code

Find `updatePlayer`. That function runs every frame and decides how the player moves.

Try one small code change:

- Make the player glide when holding jump.
- Make stopping extra slippery.
- Add a short dash when the player presses left or right.

### Quest 8: Read Enemy Objects

Find `enemyTypes`. Each enemy has data, like `speed`, and an `update` function that runs every frame.

Use the Designer to place Walker, Hopper, and Charger enemies. Then change one number in each enemy and playtest.

### Quest 9: Change Enemy AI

Pick one enemy `update` function. Try one change:

- Make the hopper jump more often.
- Make the charger notice the player from farther away.
- Make the walker reverse direction less often by changing how it uses helpers.

### Quest 10: Invent A New Rule

The functions near the bottom are game rules:

- `onCoinCollected`
- `canUseGoal`
- `onPowerUpCollected`

Change one function so the game rewards a different strategy. For example, make coins give extra points when the player has a power-up.

### Quest 11: Rename And Retheme

Find the `customization` object near the top of `js/student-challenges.js`.

Try changing:

- `game.title`
- `game.subtitle`
- `assetNames.coin` and `assetNames.coins`
- one message, such as `coinCollected`
- one background color, such as `skyColor`

To add music, put a sound file in `assets/music/`, then set:

```javascript
music: {
  src: "assets/music/theme.mp3",
  volume: 0.45,
  loop: true
}
```

Refresh the page. A Music button appears after `src` has a file path.

## Debugging Tips

- Change one thing at a time.
- Save before refreshing.
- If something breaks, undo your last change first.
- Read the error message if the browser console shows one.
- Make a tiny test level when you are trying a new mechanic.