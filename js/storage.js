(function () {
  "use strict";

  const levelKey = "platformer-lab-levels-v1";
  const spriteKey = "platformer-lab-sprites-v1";

  function clone(value) {
    return window.PixelArt.clone(value);
  }

  function loadJson(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn("Could not load saved data", error);
      return null;
    }
  }

  function saveJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeLevel(level) {
    const defaults = window.PlatformerDefaults;
    const width = Math.max(8, Number(level.width) || 32);
    const height = Math.max(8, Number(level.height) || 17);
    const tiles = Array.from({ length: height }, (_, row) => {
      const sourceRow = Array.isArray(level.tiles) ? level.tiles[row] : [];
      return Array.from({ length: width }, (_, col) => Number(sourceRow && sourceRow[col]) || 0);
    });

    return {
      name: String(level.name || "Untitled Level").slice(0, 48),
      width,
      height,
      tileSize: defaults.tileSize,
      tiles,
      objects: Array.isArray(level.objects) ? level.objects.map((object) => ({ ...object })) : []
    };
  }

  function loadLevels() {
    const saved = loadJson(levelKey);
    if (Array.isArray(saved) && saved.length > 0) {
      return saved.map(normalizeLevel);
    }
    return window.PlatformerDefaults.createDefaultLevels().map(normalizeLevel);
  }

  function saveLevels(levels) {
    saveJson(levelKey, levels.map(normalizeLevel));
  }

  function loadSprites() {
    const saved = loadJson(spriteKey);
    if (saved && typeof saved === "object") {
      return window.PixelArt.normalizeSprites(saved);
    }
    return window.PixelArt.normalizeSprites(clone(window.PlatformerDefaults.defaultSprites));
  }

  function saveSprites(sprites) {
    saveJson(spriteKey, window.PixelArt.normalizeSprites(sprites));
  }

  function resetLevels() {
    window.localStorage.removeItem(levelKey);
    return loadLevels();
  }

  function resetSprites() {
    window.localStorage.removeItem(spriteKey);
    return loadSprites();
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  function readJsonFile(file, onLoaded, onError) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        onLoaded(JSON.parse(String(reader.result)));
      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
    });
    reader.addEventListener("error", () => {
      if (onError) {
        onError(reader.error);
      }
    });
    reader.readAsText(file);
  }

  window.PlatformerStorage = {
    clone,
    normalizeLevel,
    loadLevels,
    saveLevels,
    resetLevels,
    loadSprites,
    saveSprites,
    resetSprites,
    downloadJson,
    readJsonFile
  };
})();