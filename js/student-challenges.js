(function () {
  "use strict";

  // This file is the student's playground. The engine calls these objects and
  // functions while the game runs, so edits here change real behavior without
  // requiring students to understand every collision and drawing detail first.

  const customization = {
    // The title shows in the browser tab, page header, and game data name field.
    game: {
      // Leave blank to use the Game Name field, or set a string to force a title.
      title: "",
      subtitle: "Play, design levels, redraw sprites, then change the rules."
    },

    // Rename the starter levels here, or use the Designer's Name field.
    // Numbers are level positions: 0 is the first level, 1 is the second level.
    levelNames: {
      // 0: "Moon Base",
      // 1: "Cloud Climb"
    },

    // These names are used by the Designer, Sprite Studio, HUD, and messages.
    assetNames: {
      start: "Start",
      goal: "Goal",
      coin: "Coin",
      coins: "Coins",
      checkpoint: "Checkpoint",
      powerUp: "Power Up",
      player: "Player",
      playerComet: "Comet Player",
      playerBoulder: "Boulder Player",
      enemy: "Enemy",
      enemyHopper: "Hopper Enemy",
      enemyCharger: "Charger Enemy",
      tileGrass: "Grass",
      tileDirt: "Dirt",
      tileStone: "Stone",
      tileSpike: "Spikes",
      tileSpring: "Spring"
    },

    labels: {
      level: "Level",
      gameName: "Game Name",
      buildGameData: "Build Game Data",
      restart: "Restart",
      nextLevel: "Next Level",
      score: "Score",
      lives: "Lives",
      status: "Status",
      controlsTitle: "Controls",
      controlsText: "Move with A/D or arrow keys. Jump with W, Up, or Space. Press R to restart.",
      musicOn: "Music On",
      musicOff: "Music Off"
    },

    // Messages are the text shown in the status panel, canvas, and toast popups.
    // Words inside braces, like {enemy}, are filled in by the engine.
    messages: {
      ready: "{title} is ready.",
      findGoal: "Find the flag",
      levelSaved: "Level saved.",
      spritesSaved: "Sprites saved.",
      gameDataBuilt: "Game data built.",
      gameDataSaved: "Game data saved to {path}.",
      gameDataDownloaded: "Game data downloaded. Run the dev server to save directly.",
      springJump: "Spring jump",
      spikeHit: "Watch the spikes",
      fell: "You fell",
      outOfLives: "Out of lives. Restarting.",
      tryAgain: "Try again",
      coinCollected: "{asset} collected",
      powerUpCollected: "Speed boost",
      checkpointSaved: "Checkpoint saved",
      enemyBounced: "{enemy} bounced",
      enemyHit: "Enemy hit",
      levelComplete: "Level complete",
      levelCompleteHint: "Use Next Level or open the Designer.",
      collectEveryCoinFirst: "Collect every coin first",
      musicUnavailable: "Add a music file path in js/student-challenges.js first.",
      musicStarted: "Music started.",
      musicStopped: "Music stopped."
    },

    // The canvas background uses simple colors so students can theme the game
    // without needing art software. Try a night sky, lava cave, or candy world.
    background: {
      skyColor: "#95d6f0",
      groundColor: "#f5fbff",
      mountainColor: "#6f8fb2",
      mountainStep: 320,
      mountainHeight: 130
    },

    // Optional music. Add a file such as assets/music/theme.mp3, then set src.
    // Browsers only allow music after a button click, so app.js shows a Music
    // button when src is not empty.
    music: {
      src: "",
      volume: 0.45,
      loop: true
    }
  };

  const settings = {
    // Quest 6: pick which player profile is active. Try "comet" or "boulder".
    activePlayerType: "explorer",

    // Quest 1: tune these numbers and playtest after each change.
    maxRunSpeed: 5.2,
    runAcceleration: 0.72,
    friction: 0.82,
    gravity: 0.62,
    maxFallSpeed: 13.5,
    jumpVelocity: -12.6,
    springVelocity: -16.5,

    // Quest 2: change this to 1 for double jump, or 2 for triple jump.
    airJumps: 0,

    // Quest 3: make coins more or less valuable.
    coinValue: 10,

    // Quest 4: set this to true to make the flag open only after every coin is collected.
    requireAllCoinsForGoal: false,

    // Quest 5: tune enemies until they feel challenging but fair.
    enemyPatrolSpeed: 1.25,
    enemyStompBounce: -8.5,

    // Quest 8: decide which enemy type appears when old levels have plain enemies.
    enemyPattern: ["walker", "hopper", "charger"],

    // Quest 10: change the speed boost reward from purple power-ups.
    powerUpRunBonus: 1.45,
    powerUpDurationSeconds: 6
  };

  // Player profiles are data objects. Students can add a new object here, then
  // set settings.activePlayerType to its key. Any missing number falls back to
  // the simple settings above, so a new profile can start tiny and grow later.
  const playerTypes = {
    explorer: {
      label: "Explorer",
      sprite: "player",
      width: 26,
      height: 30
    },
    comet: {
      label: "Comet",
      sprite: "playerComet",
      width: 24,
      height: 30,
      maxRunSpeed: 6.4,
      runAcceleration: 0.9,
      friction: 0.88,
      gravity: 0.52,
      jumpVelocity: -12.2,
      airJumps: 1
    },
    boulder: {
      label: "Boulder",
      sprite: "playerBoulder",
      width: 30,
      height: 30,
      maxRunSpeed: 4.2,
      runAcceleration: 0.55,
      friction: 0.78,
      gravity: 0.74,
      jumpVelocity: -13.4,
      enemyStompBounce: -10.5
    }
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

  function selectedPlayerType() {
    return playerTypes[settings.activePlayerType] || playerTypes.explorer;
  }

  function makePlayerProfile() {
    const profile = selectedPlayerType();
    return {
      key: settings.activePlayerType,
      label: profile.label || "Player",
      sprite: profile.sprite || "player",
      width: numberOrDefault(profile.width, 26),
      height: numberOrDefault(profile.height, 30),
      maxRunSpeed: numberOrDefault(profile.maxRunSpeed, settings.maxRunSpeed),
      runAcceleration: numberOrDefault(profile.runAcceleration, settings.runAcceleration),
      friction: numberOrDefault(profile.friction, settings.friction),
      gravity: numberOrDefault(profile.gravity, settings.gravity),
      maxFallSpeed: numberOrDefault(profile.maxFallSpeed, settings.maxFallSpeed),
      jumpVelocity: numberOrDefault(profile.jumpVelocity, settings.jumpVelocity),
      springVelocity: numberOrDefault(profile.springVelocity, settings.springVelocity),
      airJumps: numberOrDefault(profile.airJumps, settings.airJumps),
      enemyStompBounce: numberOrDefault(profile.enemyStompBounce, settings.enemyStompBounce)
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
      label: "Walker",
      sprite: "enemy",
      color: "#c93645",
      width: 28,
      height: 24,
      speed: 1.25,
      score: 25,
      update(enemy, gameState, helpers) {
        helpers.walkPatrol(enemy, this.speed);
      }
    },
    hopper: {
      label: "Hopper",
      sprite: "enemyHopper",
      color: "#168a55",
      width: 26,
      height: 26,
      speed: 0.75,
      jumpVelocity: -8.2,
      waitFrames: 65,
      score: 40,
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
      label: "Charger",
      sprite: "enemyCharger",
      color: "#6d57d9",
      width: 32,
      height: 24,
      speed: 0.7,
      chargeSpeed: 3.2,
      noticeDistance: 240,
      score: 60,
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
    playerTypes,
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
