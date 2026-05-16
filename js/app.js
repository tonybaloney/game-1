(function () {
  "use strict";

  // app.js is the glue layer. It loads saved/default content, connects DOM
  // controls to the game modules, and keeps the Play, Designer, and Sprite tabs
  // talking to the same level and sprite data.

  let levels;
  let sprites;
  let gameName;
  let musicAudio;
  let musicPlaying = false;
  let toastTimer;

  function byId(id) {
    return document.getElementById(id);
  }

  function toast(message) {
    const element = byId("toast");
    element.textContent = message;
    element.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => element.classList.remove("is-visible"), 2200);
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

  function setGameName(nextName) {
    gameName = String(nextName || gameName || "Untitled Game").trim() || "Untitled Game";
    document.title = gameName;
    byId("appTitle").textContent = gameName;
    byId("gameNameInput").value = gameName;
  }

  function applyCustomText() {
    const game = window.StudentChallenges.customization.game || {};
    byId("appSubtitle").textContent = game.subtitle || "";
    byId("levelSelectLabel").textContent = label("level", "Level");
    byId("gameNameLabel").textContent = label("gameName", "Game Name");
    byId("buildGameDataButton").textContent = label("buildGameData", "Build Game Data");
    byId("restartButton").textContent = label("restart", "Restart");
    byId("nextLevelButton").textContent = label("nextLevel", "Next Level");
    byId("scoreLabel").textContent = label("score", "Score");
    byId("coinLabel").textContent = assetName("coins", "Coins");
    byId("livesLabel").textContent = label("lives", "Lives");
    byId("statusLabel").textContent = label("status", "Status");
    byId("controlsTitle").textContent = label("controlsTitle", "Controls");
    byId("controlsText").textContent = label("controlsText", "Move with A/D or arrow keys. Jump with W, Up, or Space. Press R to restart.");
  }

  function updateMusicButton() {
    const button = byId("musicButton");
    button.textContent = musicPlaying ? label("musicOn", "Music On") : label("musicOff", "Music Off");
  }

  function initMusic() {
    const music = window.StudentChallenges.music();
    const button = byId("musicButton");
    if (!music || !music.src) {
      button.hidden = true;
      return;
    }

    musicAudio = new Audio(music.src);
    musicAudio.loop = music.loop !== false;
    musicAudio.volume = Math.max(0, Math.min(1, Number(music.volume) || 0.45));
    button.hidden = false;
    updateMusicButton();

    button.addEventListener("click", () => {
      if (!musicAudio) {
        toast(message("musicUnavailable", "Add a music file path in js/student-challenges.js first."));
        return;
      }

      if (musicPlaying) {
        musicAudio.pause();
        musicPlaying = false;
        updateMusicButton();
        toast(message("musicStopped", "Music stopped."));
        return;
      }

      musicAudio.play().then(() => {
        musicPlaying = true;
        updateMusicButton();
        toast(message("musicStarted", "Music started."));
      }).catch(() => {
        toast(message("musicUnavailable", "Add a music file path in js/student-challenges.js first."));
      });
    });
  }

  function setMode(mode) {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mode === mode);
    });
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.remove("is-active");
    });
    byId(`${mode}View`).classList.add("is-active");
    if (mode === "designer") {
      window.PlatformerDesigner.draw();
    } else if (mode === "sprites") {
      window.PlatformerSpriteStudio.draw();
    }
  }

  function updatePlayLevelSelect(activeIndex) {
    const select = byId("levelSelect");
    select.innerHTML = "";
    levels.forEach((level, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = level.name;
      select.appendChild(option);
    });
    select.value = String(activeIndex || 0);
  }

  function onStatus(status) {
    byId("scoreValue").textContent = String(status.score);
    byId("coinValue").textContent = status.coins;
    byId("livesValue").textContent = String(status.lives);
    byId("messageValue").textContent = status.message;
    byId("levelSelect").value = String(status.levelIndex);
  }

  function refreshGameContent(message) {
    // Editors change shared data. Refresh every view so playtesting always uses
    // the same levels and sprites the student just saved.
    window.PlatformerGame.refreshContent(levels, sprites);
    window.PlatformerDesigner.refresh(levels, sprites);
    window.PlatformerSpriteStudio.refresh(sprites);
    updatePlayLevelSelect(window.PlatformerGame.getLevelIndex());
    if (message) {
      toast(message);
    }
  }

  function initTabs() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });
  }

  function initGame() {
    updatePlayLevelSelect(0);
    setGameName(gameName);
    applyCustomText();
    initMusic();
    byId("gameNameInput").addEventListener("change", () => {
      setGameName(byId("gameNameInput").value.trim() || gameName);
      window.PlatformerStorage.saveGameName(gameName);
    });
    byId("buildGameDataButton").addEventListener("click", () => {
      if (window.PlatformerDesigner && window.PlatformerDesigner.saveLevel) {
        window.PlatformerDesigner.saveLevel();
      }
      const gameData = window.PlatformerStorage.downloadGameData(byId("gameNameInput").value, levels, sprites);
      setGameName(gameData.name);
      toast(message("gameDataBuilt", "Game data built."));
    });

    window.PlatformerGame.init({
      canvas: byId("gameCanvas"),
      levels,
      sprites,
      onStatus
    });

    byId("levelSelect").addEventListener("change", () => {
      window.PlatformerGame.setLevel(Number(byId("levelSelect").value) || 0);
    });
    byId("restartButton").addEventListener("click", () => window.PlatformerGame.restartLevel());
    byId("nextLevelButton").addEventListener("click", () => {
      window.PlatformerGame.nextLevel();
      byId("levelSelect").value = String(window.PlatformerGame.getLevelIndex());
    });
  }

  function initDesigner() {
    window.PlatformerDesigner.init({
      canvas: byId("designerCanvas"),
      levels,
      sprites,
      levelIndex: 0,
      onChange: (nextLevels) => {
        levels = nextLevels;
        window.PlatformerStorage.saveLevels(levels);
        window.PlatformerGame.refreshContent(levels, sprites);
        updatePlayLevelSelect(window.PlatformerGame.getLevelIndex());
        toast(message("levelSaved", "Level saved."));
      },
      elements: {
        playLevelSelect: byId("levelSelect"),
        designerLevelSelect: byId("designerLevelSelect"),
        nameInput: byId("levelNameInput"),
        widthInput: byId("levelWidthInput"),
        heightInput: byId("levelHeightInput"),
        scroll: byId("designerScroll"),
        brushPalette: byId("brushPalette"),
        saveButton: byId("saveLevelButton"),
        newButton: byId("newLevelButton")
      }
    });

    byId("tryLevelButton").addEventListener("click", () => {
      window.PlatformerDesigner.saveLevel();
      const index = window.PlatformerDesigner.getSelectedLevelIndex();
      window.PlatformerGame.setLevel(index);
      updatePlayLevelSelect(index);
      setMode("play");
    });
  }

  function initSpriteStudio() {
    window.PlatformerSpriteStudio.init({
      canvas: byId("spriteCanvas"),
      previewCanvas: byId("spritePreviewCanvas"),
      sprites,
      onChange: (nextSprites) => {
        sprites = nextSprites;
        window.PlatformerStorage.saveSprites(sprites);
        refreshGameContent(message("spritesSaved", "Sprites saved."));
      },
      elements: {
        spriteSelect: byId("spriteSelect"),
        paletteButtons: byId("paletteButtons"),
        saveButton: byId("saveSpritesButton"),
        resetButton: byId("resetSpritesButton"),
        buildButton: byId("buildGameDataButton")
      }
    });
  }

  async function init() {
    // Default game data comes from a build-generated file. Browser local storage
    // can still override it while a student is experimenting on one machine.
    const gameData = await window.PlatformerStorage.loadGameData(document.body.dataset.gameData);
    gameName = window.StudentChallenges.gameTitle(gameData.name);
    levels = window.StudentChallenges.customizeLevels(gameData.levels);
    sprites = gameData.sprites;
    initTabs();
    initGame();
    initDesigner();
    initSpriteStudio();
    toast(message("ready", "{title} is ready.", { title: gameName }));
  }

  window.PlatformerApp = { toast, refreshGameContent };
  document.addEventListener("DOMContentLoaded", () => {
    init().catch((error) => {
      console.error("Could not start Platformer Lab", error);
      toast(message("loadError", "Could not load game data."));
    });
  });
})();