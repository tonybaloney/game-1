(function () {
  "use strict";

  let levels;
  let sprites;
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
        toast("Level saved.");
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
        newButton: byId("newLevelButton"),
        exportButton: byId("exportLevelButton"),
        importButton: byId("importLevelButton"),
        fileInput: byId("levelFileInput")
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
        refreshGameContent("Sprites saved.");
      },
      elements: {
        spriteSelect: byId("spriteSelect"),
        paletteButtons: byId("paletteButtons"),
        saveButton: byId("saveSpritesButton"),
        resetButton: byId("resetSpritesButton"),
        exportButton: byId("exportSpritesButton"),
        importButton: byId("importSpritesButton"),
        fileInput: byId("spriteFileInput")
      }
    });
  }

  function init() {
    levels = window.PlatformerStorage.loadLevels();
    sprites = window.PlatformerStorage.loadSprites();
    initTabs();
    initGame();
    initDesigner();
    initSpriteStudio();
    toast("Platformer Lab is ready.");
  }

  window.PlatformerApp = { toast, refreshGameContent };
  document.addEventListener("DOMContentLoaded", init);
})();