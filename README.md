# Game 1: Platformer Lab

This is a small browser platformer designed for building with a kid. The game is playable immediately, but the interesting parts are intentionally exposed through visual tools and small programming quests.

## Run It Locally

From this folder:

```powershell
node tools/dev-server.js
```

Then open:

```text
http://localhost:8080
```

The dev server is still just serving static files, but it also lets the **Build Game Data** button save directly into `assets/game-data/`. If port 8080 is busy, run `node tools/dev-server.js 8081` and open `http://localhost:8081`.

## GitHub Codespaces

This repo includes `.devcontainer/devcontainer.json`, which asks Codespaces to forward port 8080 and open the browser when the dev server starts. In a new Codespace, run:

```powershell
node tools/dev-server.js
```

If the browser does not open automatically, use the forwarded port from the VS Code **Ports** tab. The server also prints a `GitHub Codespaces URL` when Codespaces provides the forwarding domain.

If you are already inside an older Codespace, rebuild it once so Codespaces picks up `.devcontainer/devcontainer.json`, or manually forward port 8080 from the **Ports** tab.

The game can still be published with GitHub Pages, Netlify, Azure Static Web Apps, or any host that serves HTML, CSS, and JavaScript.

## Build Game Data

The simplest workflow is:

1. Run `node tools/dev-server.js`.
2. Edit levels and sprites in the browser.
3. Press **Build Game Data**.

That saves the current game to `assets/game-data/<game-name>.game.json` and updates `index.html` so new browsers load it by default.

To build from the current starter content without opening the browser, run:

```powershell
node tools/build-game-data.js "Platformer Lab"
```

That creates `assets/game-data/platformer-lab.game.json` and updates `index.html` so new browsers load it first. If the game was opened from a plain static server, **Build Game Data** downloads a `.game.json` file instead; install that file with:

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
  .devcontainer/
    devcontainer.json
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
    dev-server.js
  docs/
    parent-guide.md
    student-guide.md
```

## Notes

The game has no external packages. The build step uses plain Node.js so the project stays approachable and easy to recover when experiments go sideways.