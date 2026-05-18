(function () {
  "use strict";

  // This file is the student's playground. The engine calls these objects and
  // functions while the game runs, so edits here change real behavior without
  // requiring students to understand every collision and drawing detail first.

  const customization = {
    // The title shows in the browser tab, page header, and game data name field.
    game: {
      // Leave blank to use the Game Name field, or set a string to force a title.
      title: "", // Change me to force a game title; leave "" to use the Game Name box.
      subtitle: "Play, design levels, redraw sprites, then change the rules." // Change me to rewrite the text under the title.
    },

    // Rename the starter levels here, or use the Designer's Name field.
    // Numbers are level positions: 0 is the first level, 1 is the second level.
    levelNames: {
      // 0: "Moon Base",
      // 1: "Cloud Climb"
    },

    // These names are used by the Designer, Sprite Studio, HUD, and messages.
    assetNames: {
      start: "Start", // Change me to rename the start marker brush.
      goal: "Goal", // Change me to rename the flag or exit.
      coin: "Coin", // Change me to rename one collectible.
      coins: "Coins", // Change me to rename collectibles in the HUD.
      checkpoint: "Checkpoint", // Change me to rename checkpoint objects.
      powerUp: "Power Up", // Change me to rename purple bonus objects.
      player: "Player", // Change me to rename the main character in messages.
      enemy: "Enemy", // Change me to rename the normal enemy.
      enemyHopper: "Hopper Enemy", // Change me to rename the jumping enemy.
      enemyCharger: "Charger Enemy", // Change me to rename the charging enemy.
      tileGrass: "Grass", // Change me to rename the grass brush.
      tileDirt: "Dirt", // Change me to rename the dirt brush.
      tileStone: "Stone", // Change me to rename the stone brush.
      tileSpike: "Spikes", // Change me to rename the danger brush.
      tileSpring: "Spring" // Change me to rename the bouncy brush.
    },

    labels: {
      level: "Level", // Change me to rename the level picker label.
      gameName: "Game Name", // Change me to rename the game name box label.
      buildGameData: "Build Game Data", // Change me to rename the build button.
      restart: "Restart", // Change me to rename the restart button.
      nextLevel: "Next Level", // Change me to rename the next level button.
      score: "Score", // Change me to rename the score label.
      lives: "Lives", // Change me to rename the lives label.
      status: "Status", // Change me to rename the status label.
      controlsTitle: "Controls", // Change me to rename the controls heading.
      controlsText: "Move with A/D or arrow keys. Jump with W, Up, or Space. Press R to restart.", // Change me to rewrite the controls help.
      musicOn: "Music On", // Change me to rename the music button while music plays.
      musicOff: "Music Off" // Change me to rename the music button while music is stopped.
    },

    // Messages are the text shown in the status panel, canvas, and toast popups.
    // Words inside braces, like {enemy}, are filled in by the engine.
    messages: {
      ready: "{title} is ready.", // Change me to rewrite the first status message; {title} inserts the game title.
      findGoal: "Find the flag", // Change me to rewrite the normal level goal.
      levelSaved: "Level saved.", // Change me to rewrite the level-save toast.
      spritesSaved: "Sprites saved.", // Change me to rewrite the sprite-save toast.
      gameDataBuilt: "Game data built.", // Change me to rewrite the older build message.
      gameDataSaved: "Game data saved to {path}.", // Change me to rewrite the direct-save message; {path} inserts the file path.
      gameDataDownloaded: "Game data downloaded. Run the dev server to save directly.", // Change me to rewrite the download fallback message.
      springJump: "Spring jump", // Change me to rewrite the spring feedback.
      spikeHit: "Watch the spikes", // Change me to rewrite the spike danger message.
      fell: "You fell", // Change me to rewrite the falling message.
      outOfLives: "Out of lives. Restarting.", // Change me to rewrite the no-lives message.
      tryAgain: "Try again", // Change me to rewrite the restart encouragement.
      coinCollected: "{asset} collected", // Change me to rewrite the collect message; {asset} inserts the coin name.
      powerUpCollected: "Speed boost", // Change me to rewrite the power-up message.
      checkpointSaved: "Checkpoint saved", // Change me to rewrite the checkpoint message.
      enemyBounced: "{enemy} bounced", // Change me to rewrite the stomp message; {enemy} inserts the enemy name.
      enemyHit: "Enemy hit", // Change me to rewrite the damage message.
      levelComplete: "Level complete", // Change me to rewrite the win message.
      levelCompleteHint: "Use Next Level or open the Designer.", // Change me to rewrite the hint after winning.
      collectEveryCoinFirst: "Collect every coin first", // Change me to rewrite the locked-goal message.
      musicUnavailable: "Add a music file path in js/student-challenges.js first.", // Change me to rewrite the missing-music message.
      musicStarted: "Music started.", // Change me to rewrite the music-start message.
      musicStopped: "Music stopped." // Change me to rewrite the music-stop message.
    },

    // The canvas background uses simple colors so students can theme the game
    // without needing art software. Try a night sky, lava cave, or candy world.
    background: {
      skyColor: "#95d6f0", // Change me to set the sky color; use a hex color like "#001d3d".
      groundColor: "#f5fbff", // Change me to set the strip behind the ground.
      mountainColor: "#6f8fb2", // Change me to set the far mountain color.
      mountainStep: 320, // Change me to space mountains; try 180 (many) to 520 (few).
      mountainHeight: 130 // Change me to size mountains; try 60 (low) to 220 (tall).
    },

    // Optional music. Add a file such as assets/music/theme.mp3, then set src.
    // Browsers only allow music after a button click, so app.js shows a Music
    // button when src is not empty.
    music: {
      src: "", // Change me to a file path like "assets/music/theme.mp3".
      volume: 0.45, // Change me to set loudness; use 0 (silent) to 1 (full volume).
      loop: true // Change me to false if the song should play once.
    }
  };

  const settings = {
    // Quest 6: pick the player's art. Try "playerComet" or "playerBoulder".
    // This only changes the picture. The movement numbers below still control
    // how the player feels.
    playerSprite: "player", // Change me to "playerComet" or "playerBoulder" to swap the player art.

    // Quest 1: tune these numbers and playtest after each change.
    maxRunSpeed: 5.2, // Change me to set top speed; try 3 (slow), 5 (normal), or 8 (fast).
    runAcceleration: 0.72, // Change me to set how quickly speed builds; try 0.2 (slow) to 1.4 (snappy).
    friction: 0.82, // Change me to set stopping; try 0.6 (sticky) to 0.96 (slippery).
    gravity: 0.62, // Change me to set falling; try 0.3 (floaty) to 1.0 (heavy).
    maxFallSpeed: 13.5, // Change me to cap falling speed; try 8 (gentle) to 18 (fast fall).
    jumpVelocity: -12.6, // Change me to set jump height; try -8 (small) to -16 (huge). More negative jumps higher.
    springVelocity: -16.5, // Change me to set spring height; try -12 (small) to -22 (huge). More negative bounces higher.

    // Quest 2: change this to 1 for double jump, or 2 for triple jump.
    airJumps: 0, // Change me to allow extra jumps in the air; use 0 (none), 1 (double jump), or 2 (triple jump).

    // Quest 3: make coins more or less valuable.
    coinValue: 10, // Change me to set points per coin; try 1 (tiny reward) to 100 (huge reward).

    // Quest 4: set this to true to make the flag open only after every coin is collected.
    requireAllCoinsForGoal: false, // Change me to true if the goal should require every coin.

    // Quest 5: tune enemies until they feel challenging but fair.
    enemyPatrolSpeed: 1.25, // Change me to set normal enemy speed; try 0.4 (slow) to 3 (fast).
    enemyStompBounce: -8.5, // Change me to set bounce after stomping; try -5 (small) to -14 (big).

    // Quest 8: decide which enemy type appears when old levels have plain enemies.
    enemyPattern: ["walker", "hopper", "charger"], // Change me to reorder default enemies; use "walker", "hopper", or "charger".

    // Quest 10: change the speed boost reward from purple power-ups.
    powerUpRunBonus: 1.45, // Change me to set boost strength; use 1 (no boost), 1.5 (fast), or 2 (very fast).
    powerUpDurationSeconds: 6 // Change me to set boost time; try 2 (short) to 12 (long).
  };

  function numberOrDefault(value, fallback) {
    return typeof value === "number" ? value : fallback;
  }

  function textFrom(collection, key, fallback, data) {
    const source = collection || {};
    const template = Object.prototype.hasOwnProperty.call(source, key) ? source[key] : fallback;
    return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) => {
      return data && Object.prototype.hasOwnProperty.call(data, name) ? data[name] : match;
    });
  }

  function gameTitle(fallback) {
    return customization.game.title || fallback || "Platformer Lab";
  }

  function label(key, fallback) {
    return textFrom(customization.labels, key, fallback);
  }

  function assetName(key, fallback) {
    return textFrom(customization.assetNames, key, fallback || key);
  }

  function message(key, fallback, data) {
    return textFrom(customization.messages, key, fallback || key, data);
  }

  function customizeLevels(levels) {
    const customNames = customization.levelNames || {};
    return levels.map((level, index) => {
      const originalName = level.name;
      const customName = customNames[index] || customNames[originalName];
      return customName ? { ...level, name: customName } : level;
    });
  }

  function background() {
    return customization.background;
  }

  function music() {
    return customization.music;
  }

  function makePlayerProfile() {
    const sprite = settings.playerSprite || "player";
    return {
      key: "player",
      label: assetName("player", "Player"),
      sprite,
      width: 26,
      height: 30,
      maxRunSpeed: settings.maxRunSpeed,
      runAcceleration: settings.runAcceleration,
      friction: settings.friction,
      gravity: settings.gravity,
      maxFallSpeed: settings.maxFallSpeed,
      jumpVelocity: settings.jumpVelocity,
      springVelocity: settings.springVelocity,
      airJumps: settings.airJumps,
      enemyStompBounce: settings.enemyStompBounce
    };
  }

  // This function runs every frame before the engine handles collision. It is a
  // good place to learn conditionals, velocity, helper functions, and state.
  function updatePlayer(player, gameState, input, helpers) {
    const stats = player.stats;
    const speedBonus = gameState.powerTimer > 0 ? settings.powerUpRunBonus : 1;
    const maxSpeed = stats.maxRunSpeed * speedBonus;

    if (input.left) {
      player.vx -= stats.runAcceleration * helpers.step;
      player.facing = -1;
    }

    if (input.right) {
      player.vx += stats.runAcceleration * helpers.step;
      player.facing = 1;
    }

    if (!input.left && !input.right) {
      player.vx *= Math.pow(stats.friction, helpers.step);
      if (Math.abs(player.vx) < 0.05) {
        player.vx = 0;
      }
    }

    player.vx = helpers.clamp(player.vx, -maxSpeed, maxSpeed);

    if (input.jumpPressed) {
      helpers.tryJump(player);
    }

    player.vy = helpers.clamp(player.vy + stats.gravity * helpers.step, -999, stats.maxFallSpeed);
  }

  // Enemy definitions combine data and functions. The data says how an enemy is
  // built; the update function says what it decides to do each frame.
  const enemyTypes = {
    walker: {
      label: "Walker", // Change me to rename this enemy in messages.
      sprite: "enemy", // Change me to use another sprite key, like "enemyHopper".
      color: "#c93645", // Change me to set the Designer brush color.
      width: 28, // Change me to set collision width; try 20 (small) to 36 (wide).
      height: 24, // Change me to set collision height; try 18 (short) to 34 (tall).
      speed: 1.25, // Change me to set walking speed; try 0.4 (slow) to 3 (fast).
      score: 25, // Change me to set stomp points; try 0 (none) to 100 (big reward).
      update(enemy, gameState, helpers) {
        helpers.walkPatrol(enemy, this.speed);
      }
    },
    hopper: {
      label: "Hopper", // Change me to rename this enemy in messages.
      sprite: "enemyHopper", // Change me to use another sprite key, like "enemy".
      color: "#168a55", // Change me to set the Designer brush color.
      width: 26, // Change me to set collision width; try 20 (small) to 36 (wide).
      height: 26, // Change me to set collision height; try 18 (short) to 34 (tall).
      speed: 0.75, // Change me to set walking speed; try 0.2 (slow) to 2 (fast).
      jumpVelocity: -8.2, // Change me to set hop height; try -5 (small) to -14 (huge). More negative hops higher.
      waitFrames: 65, // Change me to set time between hops; try 20 (often) to 120 (rare).
      score: 40, // Change me to set stomp points; try 0 (none) to 100 (big reward).
      update(enemy, gameState, helpers) {
        helpers.walkPatrol(enemy, this.speed);

        if (enemy.onGround) {
          enemy.behaviorTimer -= helpers.step;
          if (enemy.behaviorTimer <= 0) {
            enemy.vy = this.jumpVelocity;
            enemy.behaviorTimer = this.waitFrames;
          }
        }
      }
    },
    charger: {
      label: "Charger", // Change me to rename this enemy in messages.
      sprite: "enemyCharger", // Change me to use another sprite key, like "enemyHopper".
      color: "#6d57d9", // Change me to set the Designer brush color.
      width: 32, // Change me to set collision width; try 22 (small) to 42 (wide).
      height: 24, // Change me to set collision height; try 18 (short) to 34 (tall).
      speed: 0.7, // Change me to set patrol speed before charging; try 0.2 (slow) to 2 (fast).
      chargeSpeed: 3.2, // Change me to set charge speed; try 1 (slow) to 6 (scary fast).
      noticeDistance: 240, // Change me to set how far it sees; try 80 (near) to 420 (far).
      score: 60, // Change me to set stomp points; try 0 (none) to 150 (big reward).
      update(enemy, gameState, helpers) {
        const previousX = enemy.x;
        if (helpers.isPlayerNear(enemy, this.noticeDistance, 80)) {
          enemy.direction = helpers.directionToPlayer(enemy);
          enemy.vx = this.chargeSpeed * enemy.direction;
        } else {
          enemy.vx = this.speed * enemy.direction;
        }

        helpers.applyGravity(enemy);
        helpers.move(enemy);
        helpers.turnAtWallsAndEdges(enemy, previousX);
      }
    }
  };

  function enemyTypeFor(levelObject, enemyIndex) {
    if (levelObject.kind && enemyTypes[levelObject.kind]) {
      return levelObject.kind;
    }

    const pattern = Array.isArray(settings.enemyPattern) ? settings.enemyPattern : ["walker"];
    const patternedType = pattern[enemyIndex % pattern.length];
    return enemyTypes[patternedType] ? patternedType : "walker";
  }

  function makeEnemy(levelObject, enemyIndex) {
    const typeKey = enemyTypeFor(levelObject, enemyIndex);
    const definition = enemyTypes[typeKey] || enemyTypes.walker;

    return {
      kind: typeKey,
      label: definition.label || typeKey,
      sprite: definition.sprite || "enemy",
      width: numberOrDefault(definition.width, 28),
      height: numberOrDefault(definition.height, 24),
      speed: numberOrDefault(definition.speed, settings.enemyPatrolSpeed),
      score: numberOrDefault(definition.score, 25),
      stompable: definition.stompable !== false,
      contactDamage: definition.contactDamage !== false,
      behaviorTimer: numberOrDefault(definition.startTimer, 0)
    };
  }

  function updateEnemy(enemy, gameState, helpers) {
    const definition = enemyTypes[enemy.kind] || enemyTypes.walker;
    definition.update(enemy, gameState, helpers);
  }

  function enemySpeed(enemy) {
    return (enemy.speed || settings.enemyPatrolSpeed) * enemy.direction;
  }

  function onEnemyStomped(gameState, enemy) {
    gameState.score += enemy.score;
  }

  function onCoinCollected(gameState) {
    gameState.score += settings.coinValue;
  }

  function canUseGoal(gameState) {
    if (!settings.requireAllCoinsForGoal) {
      return true;
    }

    return gameState.coinsCollected >= gameState.totalCoins;
  }

  function onPowerUpCollected(gameState) {
    gameState.powerTimer = settings.powerUpDurationSeconds * 60;
  }

  window.StudentChallenges = {
    customization,
    settings,
    enemyTypes,
    gameTitle,
    label,
    assetName,
    message,
    customizeLevels,
    background,
    music,
    makePlayerProfile,
    updatePlayer,
    makeEnemy,
    updateEnemy,
    enemySpeed,
    onEnemyStomped,
    onCoinCollected,
    canUseGoal,
    onPowerUpCollected
  };
})();
