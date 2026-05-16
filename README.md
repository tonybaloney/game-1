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

## What Is Included

- A playable scrolling platform game in `index.html`.
- A built-in level designer, so levels are painted instead of programmed.
- A built-in sprite studio, so characters, tiles, coins, and enemies can be edited in the browser.
- Local save support through the browser's local storage.
- Export and import buttons for levels and sprites as JSON files.
- A student-friendly challenge file at `js/student-challenges.js`.
- Parent and student guides in `docs/`.

## Good First Session

1. Run the game.
2. Play the starter level.
3. Open the Designer tab and move some coins or platforms.
4. Save the level and press Try Level.
5. Open the Sprites tab and recolor the player.
6. Edit one number in `js/student-challenges.js`, such as jump height or run speed.

## Project Layout

```text
game-1/
  index.html
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
  docs/
    parent-guide.md
    student-guide.md
```

## Notes

The game works without a build step and without external packages. The built-in tools are deliberately simple, so the project stays approachable and easy to recover when experiments go sideways.