(function () {
  "use strict";

  // The game engine owns the loop, physics, collision, camera, and drawing.
  // StudentChallenges owns the creative rules that should be fun to change.
  // Keeping that boundary visible makes the engine readable while still giving
  // students meaningful behavior hooks.

  const tileSize = window.PlatformerDefaults.tileSize;
  const tileTypes = window.PlatformerDefaults.tileTypes;
  const solidTiles = new Set(tileTypes.filter((tile) => tile.solid).map((tile) => tile.id));
  const hazardTiles = new Set(tileTypes.filter((tile) => tile.hazard).map((tile) => tile.id));
  const springTiles = new Set(tileTypes.filter((tile) => tile.spring).map((tile) => tile.id));

  let canvas;
  let ctx;
  let levels = [];
  let sprites = {};
  let levelIndex = 0;
  let currentLevel;
  let state;
  let animationId;
  let lastTime = 0;
  let statusHandler = function () {};

  const input = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function label(key, fallback) {
    return window.StudentChallenges.label(key, fallback);
  }

  function assetName(key, fallback) {
    return window.StudentChallenges.assetName(key, fallback);
  }

  function message(key, fallback, data) {
    return window.StudentChallenges.message(key, fallback, data);
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function isTypingTarget(target) {
    return target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName);
  }

  function bindInput() {
    // Keyboard input is stored as simple true/false flags. The update step reads
    // those flags later, which keeps input handling separate from physics.
    window.addEventListener("keydown", (event) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      let handled = true;
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        input.left = true;
      } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        input.right = true;
      } else if (event.key === "ArrowUp" || event.key.toLowerCase() === "w" || event.key === " ") {
        if (!input.jump) {
          input.jumpPressed = true;
        }
        input.jump = true;
      } else if (event.key.toLowerCase() === "r") {
        restartLevel();
      } else {
        handled = false;
      }

      if (handled) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        input.left = false;
      } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        input.right = false;
      } else if (event.key === "ArrowUp" || event.key.toLowerCase() === "w" || event.key === " ") {
        input.jump = false;
      }
    });
  }

  function getTile(tx, ty) {
    // The engine treats space outside the sides and bottom of the level as stone
    // so the player and enemies cannot leave the designed play area.
    if (!currentLevel) {
      return 0;
    }
    if (tx < 0 || tx >= currentLevel.width || ty >= currentLevel.height) {
      return 3;
    }
    if (ty < 0) {
      return 0;
    }
    return currentLevel.tiles[ty][tx] || 0;
  }

  function getTileAtWorld(x, y) {
    return getTile(Math.floor(x / tileSize), Math.floor(y / tileSize));
  }

  function collectTilesInRect(rect, tileSet) {
    // Actors are rectangles. To collide with a tile map, we find the tile cells
    // touched by the rectangle and keep only the tile types we care about.
    const matches = [];
    const left = Math.floor(rect.x / tileSize);
    const right = Math.floor((rect.x + rect.w - 1) / tileSize);
    const top = Math.floor(rect.y / tileSize);
    const bottom = Math.floor((rect.y + rect.h - 1) / tileSize);

    for (let ty = top; ty <= bottom; ty += 1) {
      for (let tx = left; tx <= right; tx += 1) {
        const id = getTile(tx, ty);
        if (tileSet.has(id)) {
          matches.push({ tx, ty, id, x: tx * tileSize, y: ty * tileSize, w: tileSize, h: tileSize });
        }
      }
    }

    return matches;
  }

  function makePlayer(spawn) {
    const stats = window.StudentChallenges.makePlayerProfile();
    return {
      playerType: stats.key,
      sprite: stats.sprite,
      stats,
      x: spawn.x,
      y: spawn.y,
      w: stats.width,
      h: stats.height,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      airJumpsLeft: stats.airJumps,
      invincibleTimer: 0
    };
  }

  function makeRectObject(object, width, height) {
    // Level objects are stored in tile coordinates because that is easiest for
    // the designer. Gameplay uses pixel coordinates, so every object is scaled.
    return {
      ...object,
      x: object.x * tileSize,
      y: object.y * tileSize,
      w: width,
      h: height,
      collected: false
    };
  }

  function findSpawn(level) {
    // A missing start marker should not break the game; fall back to a safe-ish
    // tile near the beginning so experiments are recoverable.
    const start = level.objects.find((object) => object.type === "start");
    return {
      x: ((start && start.x) || 2) * tileSize,
      y: ((start && start.y) || 12) * tileSize
    };
  }

  function buildState() {
    // State is rebuilt on restart and level changes. It contains live gameplay
    // data, such as collected coins and defeated enemies, that should not modify
    // the saved level design.
    const spawn = findSpawn(currentLevel);
    const coins = [];
    const enemies = [];
    const checkpoints = [];
    const powerUps = [];
    let goal = makeRectObject({ type: "goal", x: currentLevel.width - 4, y: 11 }, 44, 96);
    let enemyIndex = 0;

    currentLevel.objects.forEach((object) => {
      if (object.type === "coin") {
        coins.push(makeRectObject(object, 22, 22));
      } else if (object.type === "enemy") {
        const enemyStats = window.StudentChallenges.makeEnemy(object, enemyIndex);
        const enemy = makeRectObject(object, enemyStats.width, enemyStats.height);
        Object.assign(enemy, enemyStats);
        enemy.vx = 0;
        enemy.vy = 0;
        enemy.direction = object.direction === -1 ? -1 : 1;
        enemy.onGround = false;
        enemy.defeated = false;
        enemies.push(enemy);
        enemyIndex += 1;
      } else if (object.type === "checkpoint") {
        checkpoints.push(makeRectObject(object, 30, 42));
      } else if (object.type === "powerUp") {
        powerUps.push(makeRectObject(object, 24, 24));
      } else if (object.type === "goal") {
        goal = makeRectObject(object, 44, 96);
      }
    });

    return {
      player: makePlayer(spawn),
      spawn,
      cameraX: 0,
      score: 0,
      lives: 3,
      coinsCollected: 0,
      totalCoins: coins.length,
      coins,
      enemies,
      checkpoints,
      powerUps,
      goal,
      message: message("findGoal", "Find the flag"),
      completed: false,
      pausedTimer: 0,
      powerTimer: 0
    };
  }

  function setContent(nextLevels, nextSprites) {
    levels = nextLevels;
    sprites = nextSprites;
    if (levelIndex >= levels.length) {
      levelIndex = 0;
    }
    currentLevel = levels[levelIndex];
    state = buildState();
  }

  function setLevel(index) {
    levelIndex = Math.max(0, Math.min(index, levels.length - 1));
    currentLevel = levels[levelIndex];
    state = buildState();
    updateStatus();
  }

  function restartLevel() {
    if (!currentLevel) {
      return;
    }
    state = buildState();
    updateStatus();
  }

  function nextLevel() {
    if (levels.length === 0) {
      return;
    }
    setLevel((levelIndex + 1) % levels.length);
  }

  function respawnPlayer(message) {
    // Respawning keeps the level running after mistakes. When lives reach zero,
    // the level resets but preserves a little score progress as encouragement.
    state.lives = Math.max(0, state.lives - 1);
    state.player = makePlayer(state.spawn);
    state.message = state.lives <= 0 ? window.StudentChallenges.message("outOfLives", "Out of lives. Restarting.") : message;
    if (state.lives <= 0) {
      const savedScore = state.score;
      state = buildState();
      state.score = Math.max(0, savedScore - 25);
      state.message = window.StudentChallenges.message("tryAgain", "Try again");
    }
  }

  function resolveHorizontal(actor) {
    // Horizontal and vertical collision are solved separately. This simple trick
    // avoids corner glitches and is easier to understand than full physics.
    const collisions = collectTilesInRect(actor, solidTiles);
    collisions.forEach((tile) => {
      if (actor.vx > 0) {
        actor.x = tile.x - actor.w - 0.01;
      } else if (actor.vx < 0) {
        actor.x = tile.x + tile.w + 0.01;
      }
      actor.vx = 0;
    });
  }

  function resolveVertical(actor, isPlayer) {
    const collisions = collectTilesInRect(actor, solidTiles);
    let touchedGround = false;

    collisions.forEach((tile) => {
      if (actor.vy > 0) {
        actor.y = tile.y - actor.h - 0.01;
        touchedGround = true;
      } else if (actor.vy < 0) {
        actor.y = tile.y + tile.h + 0.01;
      }
      actor.vy = 0;
    });

    actor.onGround = touchedGround;
    if (isPlayer && touchedGround) {
      actor.airJumpsLeft = actor.stats.airJumps;
    }
  }

  function moveActor(actor, step, isPlayer) {
    // The step value lets the game run at similar speed on fast and slow screens.
    actor.x += actor.vx * step;
    resolveHorizontal(actor);

    actor.y += actor.vy * step;
    if (isPlayer) {
      actor.onGround = false;
    }
    resolveVertical(actor, isPlayer);
  }

  function tryJump() {
    const player = state.player;
    if (player.onGround) {
      player.vy = player.stats.jumpVelocity;
      player.onGround = false;
      return;
    }
    if (player.airJumpsLeft > 0) {
      player.vy = player.stats.jumpVelocity;
      player.airJumpsLeft -= 1;
    }
  }

  function makePlayerHelpers(step) {
    // Helpers give student code safe, named tools without exposing the whole
    // engine. Students can use these while learning functions and parameters.
    return {
      step,
      clamp,
      tryJump
    };
  }

  function makeEnemyHelpers(step) {
    return {
      step,
      clamp,
      applyGravity(actor) {
        actor.vy = clamp(actor.vy + window.StudentChallenges.settings.gravity * step, -999, window.StudentChallenges.settings.maxFallSpeed);
      },
      move(actor) {
        moveActor(actor, step, false);
      },
      turnAtWallsAndEdges(enemy, previousX) {
        if (Math.abs(enemy.x - previousX) < 0.01) {
          enemy.direction *= -1;
        }

        const frontX = enemy.direction > 0 ? enemy.x + enemy.w + 3 : enemy.x - 3;
        const footY = enemy.y + enemy.h + 4;
        if (!solidTiles.has(getTileAtWorld(frontX, footY))) {
          enemy.direction *= -1;
        }
      },
      walkPatrol(enemy, speed) {
        const previousX = enemy.x;
        enemy.vx = (speed || enemy.speed || window.StudentChallenges.settings.enemyPatrolSpeed) * enemy.direction;
        this.applyGravity(enemy);
        this.move(enemy);
        this.turnAtWallsAndEdges(enemy, previousX);
      },
      directionToPlayer(enemy) {
        const enemyCenter = enemy.x + enemy.w / 2;
        const playerCenter = state.player.x + state.player.w / 2;
        return playerCenter < enemyCenter ? -1 : 1;
      },
      distanceToPlayer(enemy) {
        const enemyCenter = enemy.x + enemy.w / 2;
        const playerCenter = state.player.x + state.player.w / 2;
        return Math.abs(playerCenter - enemyCenter);
      },
      isPlayerNear(enemy, horizontalDistance, verticalDistance) {
        const closeX = this.distanceToPlayer(enemy) <= horizontalDistance;
        const closeY = Math.abs(state.player.y - enemy.y) <= verticalDistance;
        return closeX && closeY;
      }
    };
  }

  function updatePlayer(step) {
    const player = state.player;
    // StudentChallenges.updatePlayer decides acceleration, friction, jumping,
    // and gravity. The engine then moves the rectangle and resolves collision.
    window.StudentChallenges.updatePlayer(player, state, input, makePlayerHelpers(step));
    input.jumpPressed = false;
    moveActor(player, step, true);

    const springHit = collectTilesInRect(player, springTiles).length > 0;
    if (springHit && player.vy >= 0) {
      player.vy = player.stats.springVelocity;
      player.onGround = false;
      state.message = message("springJump", "Spring jump");
    }

    if (collectTilesInRect(player, hazardTiles).length > 0) {
      respawnPlayer(message("spikeHit", "Watch the spikes"));
    }

    if (player.y > currentLevel.height * tileSize + 120) {
      respawnPlayer(message("fell", "You fell"));
    }

    if (player.invincibleTimer > 0) {
      player.invincibleTimer -= step;
    }
  }

  function updateEnemies(step) {
    const helpers = makeEnemyHelpers(step);
    state.enemies.forEach((enemy) => {
      if (enemy.defeated) {
        return;
      }

      window.StudentChallenges.updateEnemy(enemy, state, helpers);
    });
  }

  function handleObjectCollisions() {
    // Object collision is where game rules happen: collect a coin, activate a
    // checkpoint, defeat an enemy, or finish a level.
    const player = state.player;

    state.coins.forEach((coin) => {
      if (!coin.collected && rectsOverlap(player, coin)) {
        coin.collected = true;
        state.coinsCollected += 1;
        window.StudentChallenges.onCoinCollected(state);
        state.message = message("coinCollected", "{asset} collected", { asset: assetName("coin", "Coin") });
      }
    });

    state.powerUps.forEach((powerUp) => {
      if (!powerUp.collected && rectsOverlap(player, powerUp)) {
        powerUp.collected = true;
        window.StudentChallenges.onPowerUpCollected(state);
        state.message = message("powerUpCollected", "Speed boost");
      }
    });

    state.checkpoints.forEach((checkpoint) => {
      if (!checkpoint.collected && rectsOverlap(player, checkpoint)) {
        checkpoint.collected = true;
        state.spawn = { x: checkpoint.x, y: checkpoint.y - 2 };
        state.message = message("checkpointSaved", "Checkpoint saved");
      }
    });

    state.enemies.forEach((enemy) => {
      if (enemy.defeated || !rectsOverlap(player, enemy)) {
        return;
      }

      const stomped = enemy.stompable && player.vy > 0 && player.y + player.h - enemy.y < 18;
      if (stomped) {
        enemy.defeated = true;
        player.vy = player.stats.enemyStompBounce || window.StudentChallenges.settings.enemyStompBounce;
        window.StudentChallenges.onEnemyStomped(state, enemy);
        state.message = message("enemyBounced", "{enemy} bounced", { enemy: enemy.label });
        return;
      }

      if (enemy.contactDamage && player.invincibleTimer <= 0) {
        player.invincibleTimer = 50;
        respawnPlayer(message("enemyHit", "Enemy hit"));
      }
    });

    if (rectsOverlap(player, state.goal)) {
      if (window.StudentChallenges.canUseGoal(state)) {
        state.completed = true;
        state.message = message("levelComplete", "Level complete");
      } else {
        state.message = message("collectEveryCoinFirst", "Collect every coin first");
      }
    }
  }

  function updateCamera() {
    // The camera eases toward the player instead of snapping. That small delay
    // makes movement feel smoother and gives the player more look-ahead space.
    const viewWidth = canvas.width;
    const worldWidth = currentLevel.width * tileSize;
    const target = state.player.x + state.player.w / 2 - viewWidth * 0.45;
    state.cameraX += (target - state.cameraX) * 0.12;
    state.cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - viewWidth), state.cameraX));
  }

  function update(deltaMs) {
    // requestAnimationFrame gives real milliseconds. Convert that to a 60 FPS
    // style step so movement values stay readable for students.
    if (!state || state.completed) {
      return;
    }

    const step = Math.min(2, deltaMs / 16.6667);
    if (state.powerTimer > 0) {
      state.powerTimer -= step;
    }

    updatePlayer(step);
    updateEnemies(step);
    handleObjectCollisions();
    updateCamera();
    updateStatus();
  }

  function drawBackground() {
    // The background is intentionally simple canvas drawing, not an image file,
    // so students can see that scenery is just shapes drawn in order.
    const background = window.StudentChallenges.background() || {};
    const width = canvas.width;
    const height = canvas.height;
    ctx.fillStyle = background.skyColor || "#95d6f0";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = background.groundColor || "#f5fbff";
    ctx.fillRect(0, height - 84, width, 84);

    ctx.save();
    ctx.translate(-state.cameraX * 0.18, 0);
    ctx.fillStyle = background.mountainColor || "#6f8fb2";
    for (let x = -200; x < currentLevel.width * tileSize + 400; x += background.mountainStep || 320) {
      ctx.beginPath();
      ctx.moveTo(x, height - 84);
      ctx.lineTo(x + 110, height - 84 - (background.mountainHeight || 130));
      ctx.lineTo(x + 230, height - 84);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTiles() {
    // Only draw columns that are visible on screen. This keeps long levels fast.
    const startCol = Math.max(0, Math.floor(state.cameraX / tileSize) - 1);
    const endCol = Math.min(currentLevel.width - 1, Math.ceil((state.cameraX + canvas.width) / tileSize) + 1);

    for (let row = 0; row < currentLevel.height; row += 1) {
      for (let col = startCol; col <= endCol; col += 1) {
        const id = currentLevel.tiles[row][col];
        window.PixelArt.drawTile(ctx, sprites, tileTypes, id, col * tileSize, row * tileSize, tileSize);
      }
    }
  }

  function drawObjects() {
    state.coins.forEach((coin) => {
      if (!coin.collected) {
        const bob = Math.sin(performance.now() / 220 + coin.x) * 3;
        window.PixelArt.drawSprite(ctx, sprites.coin, coin.x, coin.y + bob, coin.w, coin.h);
      }
    });

    state.powerUps.forEach((powerUp) => {
      if (!powerUp.collected) {
        window.PixelArt.drawSprite(ctx, sprites.powerUp, powerUp.x, powerUp.y, powerUp.w, powerUp.h);
      }
    });

    state.checkpoints.forEach((checkpoint) => {
      ctx.globalAlpha = checkpoint.collected ? 0.55 : 1;
      window.PixelArt.drawSprite(ctx, sprites.checkpoint, checkpoint.x, checkpoint.y, checkpoint.w, checkpoint.h);
      ctx.globalAlpha = 1;
    });

    state.enemies.forEach((enemy) => {
      if (!enemy.defeated) {
        window.PixelArt.drawSprite(ctx, sprites[enemy.sprite] || sprites.enemy, enemy.x, enemy.y, enemy.w, enemy.h, { flipX: enemy.direction < 0 });
      }
    });

    ctx.globalAlpha = window.StudentChallenges.canUseGoal(state) ? 1 : 0.45;
    window.PixelArt.drawSprite(ctx, sprites.goal, state.goal.x, state.goal.y, state.goal.w, state.goal.h);
    ctx.globalAlpha = 1;
  }

  function drawPlayer() {
    // Flickering while invincible gives feedback without adding another sprite.
    const player = state.player;
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 5) % 2 === 0) {
      return;
    }
    window.PixelArt.drawSprite(ctx, sprites[player.sprite] || sprites.player, player.x - 3, player.y - 2, player.w + 6, player.h + 2, { flipX: player.facing < 0 });
  }

  function drawHud() {
    // The HUD is drawn after restoring the camera transform, so it stays fixed
    // to the screen while the world scrolls behind it.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = "16px Segoe UI, sans-serif";
    const items = [
      `${label("score", "Score")} ${state.score}`,
      `${assetName("coins", "Coins")} ${state.coinsCollected}/${state.totalCoins}`,
      `${label("lives", "Lives")} ${state.lives}`
    ];
    const itemWidths = items.map((item) => ctx.measureText(item).width);
    const hudWidth = Math.min(canvas.width - 28, itemWidths.reduce((sum, width) => sum + width, 0) + 56 + (items.length - 1) * 28);

    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.fillRect(14, 14, hudWidth, 42);
    ctx.strokeStyle = "rgba(23, 32, 51, 0.25)";
    ctx.strokeRect(14, 14, hudWidth, 42);
    ctx.fillStyle = "#172033";
    let textX = 28;
    items.forEach((item, index) => {
      ctx.fillText(item, textX, 40);
      textX += itemWidths[index] + 28;
    });

    if (state.completed) {
      ctx.fillStyle = "rgba(23, 32, 51, 0.82)";
      ctx.fillRect(canvas.width / 2 - 190, canvas.height / 2 - 60, 380, 120);
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(message("levelComplete", "Level Complete"), canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = "16px Segoe UI, sans-serif";
      ctx.fillText(message("levelCompleteHint", "Use Next Level or open the Designer."), canvas.width / 2, canvas.height / 2 + 26);
    }
    ctx.restore();
  }

  function draw() {
    if (!ctx || !currentLevel || !state) {
      return;
    }

    drawBackground();
    ctx.save();
    ctx.translate(-Math.floor(state.cameraX), 0);
    drawTiles();
    drawObjects();
    drawPlayer();
    ctx.restore();
    drawHud();
  }

  function loop(time) {
    // The main loop always follows the same order: measure time, update the
    // world, draw the world, then ask the browser for the next frame.
    const delta = lastTime ? time - lastTime : 16.6667;
    lastTime = time;
    update(delta);
    draw();
    animationId = window.requestAnimationFrame(loop);
  }

  function updateStatus() {
    // HTML controls live outside the canvas, so the engine sends status updates
    // through a callback instead of directly editing the page everywhere.
    if (!state) {
      return;
    }
    statusHandler({
      score: state.score,
      coins: `${state.coinsCollected} / ${state.totalCoins}`,
      lives: state.lives,
      message: state.message,
      levelIndex
    });
  }

  function init(options) {
    // init is the only place that receives DOM elements. After this, the engine
    // works with canvas, levels, sprites, and plain JavaScript objects.
    canvas = options.canvas;
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    statusHandler = options.onStatus || statusHandler;
    setContent(options.levels, options.sprites);
    bindInput();
    updateStatus();
    if (animationId) {
      window.cancelAnimationFrame(animationId);
    }
    animationId = window.requestAnimationFrame(loop);
  }

  function refreshContent(nextLevels, nextSprites) {
    // The editor can change levels or sprites while the game is running. Refresh
    // swaps in the new content without rebuilding the whole application.
    levels = nextLevels;
    sprites = nextSprites;
    if (!currentLevel || !levels[levelIndex]) {
      levelIndex = 0;
      currentLevel = levels[0];
      state = buildState();
      return;
    }
    currentLevel = levels[levelIndex];
  }

  window.PlatformerGame = {
    init,
    refreshContent,
    setLevel,
    restartLevel,
    nextLevel,
    getLevelIndex: () => levelIndex,
    getState: () => state
  };
})();