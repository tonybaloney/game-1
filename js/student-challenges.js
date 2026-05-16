(function () {
  "use strict";

  const settings = {
    // Quest 1: Tune these numbers and playtest after each change.
    maxRunSpeed: 5.2,
    runAcceleration: 0.72,
    friction: 0.82,
    gravity: 0.62,
    maxFallSpeed: 13.5,
    jumpVelocity: -12.6,
    springVelocity: -16.5,

    // Quest 2: Change this to 1 for double jump, or 2 for triple jump.
    airJumps: 0,

    // Quest 3: Make coins more or less valuable.
    coinValue: 10,

    // Quest 4: Set this to true to make the flag open only after every coin is collected.
    requireAllCoinsForGoal: false,

    // Quest 5: Tune enemies until they feel challenging but fair.
    enemyPatrolSpeed: 1.25,
    enemyStompBounce: -8.5,

    // Quest 6: Change the speed boost reward from purple power-ups.
    powerUpRunBonus: 1.45,
    powerUpDurationSeconds: 6
  };

  function onCoinCollected(gameState) {
    gameState.score += settings.coinValue;
  }

  function canUseGoal(gameState) {
    if (!settings.requireAllCoinsForGoal) {
      return true;
    }

    return gameState.coinsCollected >= gameState.totalCoins;
  }

  function enemySpeed(enemy) {
    return settings.enemyPatrolSpeed * enemy.direction;
  }

  function onPowerUpCollected(gameState) {
    gameState.powerTimer = settings.powerUpDurationSeconds * 60;
  }

  window.StudentChallenges = {
    settings,
    onCoinCollected,
    canUseGoal,
    enemySpeed,
    onPowerUpCollected
  };
})();