# Game 1: Platformer Lab

This is a small browser platformer designed for building with a kid. The game is playable immediately, but the interesting parts are intentionally exposed through visual tools and small programming quests.

## Run It Locally

From this folder:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

It is a static site, so it can also be published with GitHub Pages, Netlify, Azure Static Web Apps, or any host that serves HTML, CSS, and JavaScript.

## Build Game Data

The game starts from one shared data file. To build that file from the current starter content and make it the default, run:

```powershell
node tools/build-game-data.js "Platformer Lab"
```

That creates `assets/game-data/platformer-lab.game.json` and updates `index.html` so new browsers load it first. To install a game data file made from the in-browser tools, pass it as the source:

```powershell
node tools/build-game-data.js "My Game" --from path\to\my-game.game.json
```

## What Is Included

- A playable scrolling platform game in `index.html`.
- A built-in level designer, so levels are painted instead of programmed.
- A built-in sprite studio, so characters, tiles, coins, and enemies can be edited in the browser.
- Student-editable player profiles, enemy behaviors, and gameplay rule hooks.
- Student-editable title, labels, messages, background colors, asset names, and optional music path.
- Local save support through the browser's local storage.
- A single game data build flow for levels and sprites together.
- A student-friendly challenge file at `js/student-challenges.js`.
- Parent and student guides in `docs/`.

## Good First Session

1. Run the game.
2. Play the starter level.
3. Open the Designer tab and move some coins or platforms.
4. Save the level and press Try Level.
5. Open the Sprites tab and recolor the player.
6. Edit one number in `js/student-challenges.js`, such as jump height or run speed.
7. Change `activePlayerType` to `comet`, then compare how that profile overrides the base settings.
8. Place Walker, Hopper, and Charger enemies in the Designer and change their behavior functions.
9. Edit the `customization` object to rename the game, coins, messages, or background colors.

## Project Layout

```text
game-1/
  index.html
  assets/
    game-data/
    music/
  css/
    style.css
  js/
    app.js
    default-content.js
    designer.js
    game.js
    sprites.js
    sprite-studio.js
    storage.js
    student-challenges.js
  tools/
    build-game-data.js
  docs/
    parent-guide.md
    student-guide.md
```

## Notes

The game has no external packages. The build step uses plain Node.js so the project stays approachable and easy to recover when experiments go sideways.