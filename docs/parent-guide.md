# Parent Guide

This project is meant to reduce the amount of engine work you need to do while still giving your child real programming moments.

## Recommended Rhythm

Keep sessions short and visible:

1. Start by playing.
2. Let your child choose one creative change.
3. Make the smallest code or design change that supports it.
4. Test immediately.
5. Stop while the game still feels fun.

## What Is Prebuilt

- Canvas rendering.
- Keyboard input.
- Player movement.
- Jumping and gravity.
- Tile collisions.
- Camera scrolling.
- Coins, enemies, spikes, checkpoints, power-ups, and goals.
- Local saving.
- One game data build file for shared levels and sprites.

## What Your Child Can Safely Edit

The best first file is `js/student-challenges.js`. It contains customization text, settings, player profiles, enemy behavior objects, and small functions that affect visible behavior without requiring them to understand the whole engine.

Good first changes:

- Run speed.
- Jump strength.
- Gravity.
- Coin value.
- Enemy speed.
- Whether the goal requires all coins.

Good next changes:

- Switch `activePlayerType` between `explorer`, `comet`, and `boulder`.
- Rename the game, levels, assets, and messages in `customization`.
- Change the canvas background colors or add an optional music file path.
- Add a new object to `playerTypes` and give it a movement trade-off.
- Change an enemy `update` function so it hops, charges, waits, or reacts to the player.
- Use `gameState` in `onCoinCollected`, `canUseGoal`, or `onPowerUpCollected` to create a new rule.

Concepts this introduces:

- Objects and properties.
- Functions and parameters.
- Arrays and patterns.
- If statements and comparisons.
- Timers and per-frame updates.
- Separating engine code from game-specific rules.

## Customization

The `customization` object in `js/student-challenges.js` is the safest place for identity and presentation changes:

- `game` changes the title and subtitle.
- `levelNames` can rename starter levels by index, while the Designer can rename levels visually.
- `assetNames` changes labels like Coin, Goal, Player, and tile names.
- `messages` changes status text and feedback messages.
- `background` changes the canvas sky, ground, and mountain colors.
- `music` can point to a file in `assets/music/` and control volume and looping.

## Level Design

Use the Designer tab for levels. Your child paints the level in the browser and saves it there while they work. When the project is ready to share, build one game data file instead of keeping separate level files.

Suggested level rules:

- Make the start and goal obvious.
- Teach one mechanic per level.
- Put checkpoints before hard sections.
- Avoid blind jumps.
- Playtest without explaining the level.

## Sprite Editing

The built-in Sprite Studio is enough for recoloring and redrawing simple pixel art. If your child wants a stronger art tool later, try one of these:

- Piskel: browser-based and easy to start.
- Pixelorama: free desktop pixel art editor.
- Aseprite: paid, polished, and popular for pixel art.

The built-in editor stores sprites in local storage while your child experiments. The game data build keeps the final levels and sprites together, so you do not need to teach spritesheets or file formats early.

## Building Shared Game Data

The Play tab has a Game Name field and a Build Game Data button. That creates one `.game.json` file containing the current levels and sprites.

To make that file the default for everyone who opens the project, run this from the repo folder:

```powershell
node tools/build-game-data.js "My Game" --from path\to\my-game.game.json
```

The command copies the data into `assets/game-data/` and updates `index.html` to load it for new browsers.

## Publishing Online

This is a static site. Any static host will work.

For GitHub Pages:

1. Put the project in a GitHub repository.
2. Commit the files.
3. Enable Pages for the repository.
4. Open the generated Pages URL.

For a quick local check, run:

```powershell
node tools/dev-server.js
```

Then open `http://localhost:8080`.

When using this dev server, the Play tab's Build Game Data button writes directly to `assets/game-data/` and updates `index.html`. If you use a plain static server instead, the button downloads a `.game.json` file that can still be installed later with `node tools/build-game-data.js "My Game" --from path\to\file.game.json`.

## Backup Advice

Because drafts are saved in the browser, use Build Game Data after a good session. With `node tools/dev-server.js`, that saves directly into the project; otherwise, keep the downloaded `.game.json` somewhere safe.