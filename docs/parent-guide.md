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
- Level import/export.
- Sprite import/export.

## What Your Child Can Safely Edit

The best first file is `js/student-challenges.js`. It contains settings and small functions that affect visible behavior without requiring them to understand the whole engine.

Good first changes:

- Run speed.
- Jump strength.
- Gravity.
- Coin value.
- Enemy speed.
- Whether the goal requires all coins.

## Level Design

Use the Designer tab for levels. The level format is JSON, but your child does not need to write it. The Export Level button creates a file you can keep, share, or check into source control later.

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

The built-in editor stores sprites in local storage and can export/import them as JSON. That keeps the project simple and avoids teaching spritesheets too early.

## Publishing Online

This is a static site. Any static host will work.

For GitHub Pages:

1. Put the project in a GitHub repository.
2. Commit the files.
3. Enable Pages for the repository.
4. Open the generated Pages URL.

For a quick local check, run:

```powershell
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Backup Advice

Because levels and sprites are saved in the browser, use Export Level and Export Sprites after a good session. Save those JSON files somewhere safe.