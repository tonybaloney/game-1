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

## Debugging Tips

- Change one thing at a time.
- Save before refreshing.
- If something breaks, undo your last change first.
- Read the error message if the browser console shows one.
- Make a tiny test level when you are trying a new mechanic.