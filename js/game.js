(function () {
  "use strict";

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

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function isTypingTarget(target) {
    return target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName);
  }

  function bindInput() {
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
    return {
      x: spawn.x,
      y: spawn.y,
      w: 26,
      h: 30,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      airJumpsLeft: window.StudentChallenges.settings.airJumps,
      invincibleTimer: 0
    };
  }

  function makeRectObject(object, width, height) {
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
    const start = level.objects.find((object) => object.type === "start");
    return {
      x: ((start && start.x) || 2) * tileSize,
      y: ((start && start.y) || 12) * tileSize
    };
  }

  function buildState() {
    const spawn = findSpawn(currentLevel);
    const coins = [];
    const enemies = [];
    const checkpoints = [];
    const powerUps = [];
    let goal = makeRectObject({ type: "goal", x: currentLevel.width - 4, y: 11 }, 44, 96);

    currentLevel.objects.forEach((object) => {
      if (object.type === "coin") {
        coins.push(makeRectObject(object, 22, 22));
      } else if (object.type === "enemy") {
        const enemy = makeRectObject(object, 28, 24);
        enemy.vx = 0;
        enemy.vy = 0;
        enemy.direction = object.direction === -1 ? -1 : 1;
        enemy.defeated = false;
        enemies.push(enemy);
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
      message: "Find the flag",
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
    state.lives = Math.max(0, state.lives - 1);
    state.player = makePlayer(state.spawn);
    state.message = state.lives <= 0 ? "Out of lives. Restarting." : message;
    if (state.lives <= 0) {
      const savedScore = state.score;
      state = buildState();
      state.score = Math.max(0, savedScore - 25);
      state.message = "Try again";
    }
  }

  function resolveHorizontal(actor) {
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

    if (isPlayer) {
      actor.onGround = touchedGround;
      if (touchedGround) {
        actor.airJumpsLeft = window.StudentChallenges.settings.airJumps;
      }
    }
  }

  function moveActor(actor, step, isPlayer) {
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
    const settings = window.StudentChallenges.settings;
    if (player.onGround) {
      player.vy = settings.jumpVelocity;
      player.onGround = false;
      return;
    }
    if (player.airJumpsLeft > 0) {
      player.vy = settings.jumpVelocity;
      player.airJumpsLeft -= 1;
    }
  }

  function updatePlayer(step) {
    const player = state.player;
    const settings = window.StudentChallenges.settings;
    const speedBonus = state.powerTimer > 0 ? settings.powerUpRunBonus : 1;
    const maxSpeed = settings.maxRunSpeed * speedBonus;

    if (input.left) {
      player.vx -= settings.runAcceleration * step;
      player.facing = -1;
    }
    if (input.right) {
      player.vx += settings.runAcceleration * step;
      player.facing = 1;
    }
    if (!input.left && !input.right) {
      player.vx *= Math.pow(settings.friction, step);
      if (Math.abs(player.vx) < 0.05) {
        player.vx = 0;
      }
    }

    player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));

    if (input.jumpPressed) {
      tryJump();
    }
    input.jumpPressed = false;

    player.vy = Math.min(settings.maxFallSpeed, player.vy + settings.gravity * step);
    moveActor(player, step, true);

    const springHit = collectTilesInRect(player, springTiles).length > 0;
    if (springHit && player.vy >= 0) {
      player.vy = settings.springVelocity;
      player.onGround = false;
      state.message = "Spring jump";
    }

    if (collectTilesInRect(player, hazardTiles).length > 0) {
      respawnPlayer("Watch the spikes");
    }

    if (player.y > currentLevel.height * tileSize + 120) {
      respawnPlayer("You fell");
    }

    if (player.invincibleTimer > 0) {
      player.invincibleTimer -= step;
    }
  }

  function updateEnemies(step) {
    state.enemies.forEach((enemy) => {
      if (enemy.defeated) {
        return;
      }

      enemy.vx = window.StudentChallenges.enemySpeed(enemy);
      enemy.vy = Math.min(window.StudentChallenges.settings.maxFallSpeed, enemy.vy + window.StudentChallenges.settings.gravity * step);
      const previousX = enemy.x;
      moveActor(enemy, step, false);

      if (Math.abs(enemy.x - previousX) < 0.01) {
        enemy.direction *= -1;
      }

      const frontX = enemy.direction > 0 ? enemy.x + enemy.w + 3 : enemy.x - 3;
      const footY = enemy.y + enemy.h + 4;
      if (!solidTiles.has(getTileAtWorld(frontX, footY))) {
        enemy.direction *= -1;
      }
    });
  }

  function handleObjectCollisions() {
    const player = state.player;

    state.coins.forEach((coin) => {
      if (!coin.collected && rectsOverlap(player, coin)) {
        coin.collected = true;
        state.coinsCollected += 1;
        window.StudentChallenges.onCoinCollected(state);
        state.message = "Coin collected";
      }
    });

    state.powerUps.forEach((powerUp) => {
      if (!powerUp.collected && rectsOverlap(player, powerUp)) {
        powerUp.collected = true;
        window.StudentChallenges.onPowerUpCollected(state);
        state.message = "Speed boost";
      }
    });

    state.checkpoints.forEach((checkpoint) => {
      if (!checkpoint.collected && rectsOverlap(player, checkpoint)) {
        checkpoint.collected = true;
        state.spawn = { x: checkpoint.x, y: checkpoint.y - 2 };
        state.message = "Checkpoint saved";
      }
    });

    state.enemies.forEach((enemy) => {
      if (enemy.defeated || !rectsOverlap(player, enemy)) {
        return;
      }

      const stomped = player.vy > 0 && player.y + player.h - enemy.y < 18;
      if (stomped) {
        enemy.defeated = true;
        player.vy = window.StudentChallenges.settings.enemyStompBounce;
        state.score += 25;
        state.message = "Enemy bounced";
        return;
      }

      if (player.invincibleTimer <= 0) {
        player.invincibleTimer = 50;
        respawnPlayer("Enemy hit");
      }
    });

    if (rectsOverlap(player, state.goal)) {
      if (window.StudentChallenges.canUseGoal(state)) {
        state.completed = true;
        state.message = "Level complete";
      } else {
        state.message = "Collect every coin first";
      }
    }
  }

  function updateCamera() {
    const viewWidth = canvas.width;
    const worldWidth = currentLevel.width * tileSize;
    const target = state.player.x + state.player.w / 2 - viewWidth * 0.45;
    state.cameraX += (target - state.cameraX) * 0.12;
    state.cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - viewWidth), state.cameraX));
  }

  function update(deltaMs) {
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
    const width = canvas.width;
    const height = canvas.height;
    ctx.fillStyle = "#95d6f0";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#f5fbff";
    ctx.fillRect(0, height - 84, width, 84);

    ctx.save();
    ctx.translate(-state.cameraX * 0.18, 0);
    ctx.fillStyle = "#6f8fb2";
    for (let x = -200; x < currentLevel.width * tileSize + 400; x += 320) {
      ctx.beginPath();
      ctx.moveTo(x, height - 84);
      ctx.lineTo(x + 110, height - 214);
      ctx.lineTo(x + 230, height - 84);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTiles() {
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
        window.PixelArt.drawSprite(ctx, sprites.enemy, enemy.x, enemy.y, enemy.w, enemy.h, { flipX: enemy.direction < 0 });
      }
    });

    ctx.globalAlpha = window.StudentChallenges.canUseGoal(state) ? 1 : 0.45;
    window.PixelArt.drawSprite(ctx, sprites.goal, state.goal.x, state.goal.y, state.goal.w, state.goal.h);
    ctx.globalAlpha = 1;
  }

  function drawPlayer() {
    const player = state.player;
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 5) % 2 === 0) {
      return;
    }
    window.PixelArt.drawSprite(ctx, sprites.player, player.x - 3, player.y - 2, 32, 32, { flipX: player.facing < 0 });
  }

  function drawHud() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.fillRect(14, 14, 318, 42);
    ctx.strokeStyle = "rgba(23, 32, 51, 0.25)";
    ctx.strokeRect(14, 14, 318, 42);
    ctx.fillStyle = "#172033";
    ctx.font = "16px Segoe UI, sans-serif";
    ctx.fillText(`Score ${state.score}`, 28, 40);
    ctx.fillText(`Coins ${state.coinsCollected}/${state.totalCoins}`, 134, 40);
    ctx.fillText(`Lives ${state.lives}`, 254, 40);

    if (state.completed) {
      ctx.fillStyle = "rgba(23, 32, 51, 0.82)";
      ctx.fillRect(canvas.width / 2 - 190, canvas.height / 2 - 60, 380, 120);
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Level Complete", canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = "16px Segoe UI, sans-serif";
      ctx.fillText("Use Next Level or open the Designer.", canvas.width / 2, canvas.height / 2 + 26);
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
    const delta = lastTime ? time - lastTime : 16.6667;
    lastTime = time;
    update(delta);
    draw();
    animationId = window.requestAnimationFrame(loop);
  }

  function updateStatus() {
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