(function () {
  "use strict";

  const tileSize = window.PlatformerDefaults.tileSize;
  const tileTypes = window.PlatformerDefaults.tileTypes;
  const objectTools = [
    { type: "start", label: "Start", color: "#2463eb" },
    { type: "goal", label: "Goal", color: "#e36d5d" },
    { type: "coin", label: "Coin", color: "#f0bf3f" },
    { type: "enemy", label: "Enemy", color: "#c93645" },
    { type: "checkpoint", label: "Checkpoint", color: "#2fb7c7" },
    { type: "powerUp", label: "Power Up", color: "#6d57d9" }
  ];

  let canvas;
  let ctx;
  let levels = [];
  let sprites = {};
  let selectedLevelIndex = 0;
  let selectedTool = { kind: "tile", id: 1, label: "Grass" };
  let cameraX = 0;
  let isPainting = false;
  let onChange = function () {};
  let elements = {};

  function currentLevel() {
    return levels[selectedLevelIndex];
  }

  function setElements(nextElements) {
    elements = nextElements;
  }

  function updateScrollRange() {
    if (!elements.scroll || !currentLevel()) {
      return;
    }
    const max = Math.max(0, currentLevel().width * tileSize - canvas.width);
    elements.scroll.max = String(max);
    elements.scroll.value = String(Math.min(cameraX, max));
  }

  function populateLevelSelects() {
    [elements.designerLevelSelect, elements.playLevelSelect].forEach((select) => {
      if (!select) {
        return;
      }
      select.innerHTML = "";
      levels.forEach((level, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = level.name;
        select.appendChild(option);
      });
    });
    if (elements.designerLevelSelect) {
      elements.designerLevelSelect.value = String(selectedLevelIndex);
    }
  }

  function syncForm() {
    const level = currentLevel();
    if (!level) {
      return;
    }
    elements.nameInput.value = level.name;
    elements.widthInput.value = String(level.width);
    elements.heightInput.value = String(level.height);
    updateScrollRange();
  }

  function createSwatch(color) {
    const span = document.createElement("span");
    span.className = "tool-swatch";
    span.style.background = color || "#ffffff";
    return span;
  }

  function renderBrushPalette() {
    const palette = elements.brushPalette;
    palette.innerHTML = "";

    const erase = document.createElement("button");
    erase.type = "button";
    erase.className = "tool-button";
    erase.dataset.kind = "erase";
    erase.appendChild(createSwatch("#ffffff"));
    erase.append("Erase");
    palette.appendChild(erase);

    tileTypes.filter((tile) => tile.id !== 0).forEach((tile) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tool-button";
      button.dataset.kind = "tile";
      button.dataset.id = String(tile.id);
      button.appendChild(createSwatch(tile.color));
      button.append(tile.name);
      palette.appendChild(button);
    });

    objectTools.forEach((tool) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tool-button";
      button.dataset.kind = "object";
      button.dataset.type = tool.type;
      button.appendChild(createSwatch(tool.color));
      button.append(tool.label);
      palette.appendChild(button);
    });

    palette.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) {
        return;
      }

      if (button.dataset.kind === "tile") {
        const tile = tileTypes.find((candidate) => candidate.id === Number(button.dataset.id));
        selectedTool = { kind: "tile", id: tile.id, label: tile.name };
      } else if (button.dataset.kind === "object") {
        selectedTool = { kind: "object", type: button.dataset.type, label: button.textContent.trim() };
      } else {
        selectedTool = { kind: "erase", label: "Erase" };
      }
      markActiveTool();
    });
    markActiveTool();
  }

  function markActiveTool() {
    elements.brushPalette.querySelectorAll("button").forEach((button) => {
      let active = false;
      if (selectedTool.kind === "tile" && button.dataset.kind === "tile") {
        active = Number(button.dataset.id) === selectedTool.id;
      } else if (selectedTool.kind === "object" && button.dataset.kind === "object") {
        active = button.dataset.type === selectedTool.type;
      } else if (selectedTool.kind === "erase" && button.dataset.kind === "erase") {
        active = true;
      }
      button.classList.toggle("is-active", active);
    });
  }

  function pointerToCell(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX + cameraX;
    const y = (event.clientY - rect.top) * scaleY;
    return {
      col: Math.floor(x / tileSize),
      row: Math.floor(y / tileSize)
    };
  }

  function removeObjectsAt(level, col, row) {
    level.objects = level.objects.filter((object) => object.x !== col || object.y !== row);
  }

  function placeObject(level, col, row, type) {
    if (type === "start" || type === "goal") {
      level.objects = level.objects.filter((object) => object.type !== type);
    }
    removeObjectsAt(level, col, row);
    level.objects.push({ type, x: col, y: row, direction: type === "enemy" ? 1 : undefined });
    level.objects = level.objects.map((object) => {
      const clean = { ...object };
      if (clean.direction === undefined) {
        delete clean.direction;
      }
      return clean;
    });
  }

  function paintCell(event) {
    const level = currentLevel();
    const cell = pointerToCell(event);
    if (!level || cell.col < 0 || cell.row < 0 || cell.col >= level.width || cell.row >= level.height) {
      return;
    }

    if (selectedTool.kind === "tile") {
      level.tiles[cell.row][cell.col] = selectedTool.id;
    } else if (selectedTool.kind === "object") {
      placeObject(level, cell.col, cell.row, selectedTool.type);
    } else {
      level.tiles[cell.row][cell.col] = 0;
      removeObjectsAt(level, cell.col, cell.row);
    }
    draw();
  }

  function applyFormChanges() {
    const level = currentLevel();
    if (!level) {
      return;
    }

    const width = Math.max(32, Math.min(160, Number(elements.widthInput.value) || level.width));
    const height = Math.max(12, Math.min(22, Number(elements.heightInput.value) || level.height));
    const nextTiles = Array.from({ length: height }, (_, row) => {
      return Array.from({ length: width }, (_, col) => {
        return level.tiles[row] && level.tiles[row][col] ? level.tiles[row][col] : 0;
      });
    });

    level.name = elements.nameInput.value.trim() || "Untitled Level";
    level.width = width;
    level.height = height;
    level.tiles = nextTiles;
    level.objects = level.objects.filter((object) => object.x >= 0 && object.x < width && object.y >= 0 && object.y < height);
    populateLevelSelects();
    syncForm();
    draw();
  }

  function saveLevel() {
    applyFormChanges();
    window.PlatformerStorage.saveLevels(levels);
    onChange(levels);
  }

  function newLevel() {
    const level = window.PlatformerDefaults.makeLevel(`New Level ${levels.length + 1}`, 96, 17);
    for (let col = 0; col < level.width; col += 1) {
      level.tiles[14][col] = 2;
      level.tiles[15][col] = 2;
      level.tiles[16][col] = 2;
    }
    level.objects = [
      { type: "start", x: 2, y: 13 },
      { type: "goal", x: 91, y: 11 }
    ];
    levels.push(level);
    selectedLevelIndex = levels.length - 1;
    cameraX = 0;
    populateLevelSelects();
    syncForm();
    draw();
    saveLevel();
  }

  function drawObject(object) {
    const x = object.x * tileSize;
    const y = object.y * tileSize;
    if (object.type === "start") {
      ctx.fillStyle = "#2463eb";
      ctx.fillRect(x + 7, y + 5, 18, 24);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + 12, y + 10, 8, 8);
    } else if (object.type === "goal") {
      window.PixelArt.drawSprite(ctx, sprites.goal, x + 2, y - 64, 44, 96);
    } else if (object.type === "coin") {
      window.PixelArt.drawSprite(ctx, sprites.coin, x + 5, y + 5, 22, 22);
    } else if (object.type === "enemy") {
      window.PixelArt.drawSprite(ctx, sprites.enemy, x + 2, y + 8, 28, 24);
    } else if (object.type === "checkpoint") {
      window.PixelArt.drawSprite(ctx, sprites.checkpoint, x + 2, y - 10, 30, 42);
    } else if (object.type === "powerUp") {
      window.PixelArt.drawSprite(ctx, sprites.powerUp, x + 4, y + 4, 24, 24);
    }
  }

  function drawGrid(level) {
    ctx.strokeStyle = "rgba(23, 32, 51, 0.16)";
    ctx.lineWidth = 1;
    const startCol = Math.max(0, Math.floor(cameraX / tileSize));
    const endCol = Math.min(level.width, Math.ceil((cameraX + canvas.width) / tileSize));
    for (let col = startCol; col <= endCol; col += 1) {
      const x = col * tileSize;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, level.height * tileSize);
      ctx.stroke();
    }
    for (let row = 0; row <= level.height; row += 1) {
      const y = row * tileSize;
      ctx.beginPath();
      ctx.moveTo(startCol * tileSize, y);
      ctx.lineTo(endCol * tileSize, y);
      ctx.stroke();
    }
  }

  function draw() {
    const level = currentLevel();
    if (!level) {
      return;
    }

    ctx.fillStyle = "#95d6f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-Math.floor(cameraX), 0);

    const startCol = Math.max(0, Math.floor(cameraX / tileSize) - 1);
    const endCol = Math.min(level.width - 1, Math.ceil((cameraX + canvas.width) / tileSize) + 1);
    for (let row = 0; row < level.height; row += 1) {
      for (let col = startCol; col <= endCol; col += 1) {
        const id = level.tiles[row][col];
        window.PixelArt.drawTile(ctx, sprites, tileTypes, id, col * tileSize, row * tileSize, tileSize);
      }
    }

    level.objects.forEach(drawObject);
    drawGrid(level);
    ctx.restore();

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(10, 10, 250, 34);
    ctx.fillStyle = "#172033";
    ctx.font = "15px Segoe UI, sans-serif";
    ctx.fillText(`Brush: ${selectedTool.label}`, 22, 32);
  }

  function init(options) {
    canvas = options.canvas;
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    levels = options.levels;
    sprites = options.sprites;
    selectedLevelIndex = options.levelIndex || 0;
    onChange = options.onChange || onChange;
    setElements(options.elements);
    renderBrushPalette();
    populateLevelSelects();
    syncForm();

    canvas.addEventListener("pointerdown", (event) => {
      isPainting = true;
      canvas.setPointerCapture(event.pointerId);
      paintCell(event);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (isPainting) {
        paintCell(event);
      }
    });
    canvas.addEventListener("pointerup", () => {
      isPainting = false;
    });
    canvas.addEventListener("pointercancel", () => {
      isPainting = false;
    });

    elements.scroll.addEventListener("input", () => {
      cameraX = Number(elements.scroll.value) || 0;
      draw();
    });
    elements.designerLevelSelect.addEventListener("change", () => {
      selectedLevelIndex = Number(elements.designerLevelSelect.value) || 0;
      cameraX = 0;
      syncForm();
      draw();
    });
    elements.nameInput.addEventListener("change", applyFormChanges);
    elements.widthInput.addEventListener("change", applyFormChanges);
    elements.heightInput.addEventListener("change", applyFormChanges);
    elements.saveButton.addEventListener("click", saveLevel);
    elements.newButton.addEventListener("click", newLevel);
    elements.exportButton.addEventListener("click", () => {
      saveLevel();
      window.PlatformerStorage.downloadJson(`${currentLevel().name.replace(/\s+/g, "-").toLowerCase()}.level.json`, currentLevel());
    });
    elements.importButton.addEventListener("click", () => elements.fileInput.click());
    elements.fileInput.addEventListener("change", () => {
      const file = elements.fileInput.files[0];
      if (!file) {
        return;
      }
      window.PlatformerStorage.readJsonFile(file, (json) => {
        levels.push(window.PlatformerStorage.normalizeLevel(json));
        selectedLevelIndex = levels.length - 1;
        saveLevel();
        populateLevelSelects();
        syncForm();
        draw();
      }, () => window.PlatformerApp.toast("Could not import that level file."));
      elements.fileInput.value = "";
    });

    draw();
  }

  function refresh(nextLevels, nextSprites) {
    levels = nextLevels;
    sprites = nextSprites;
    if (selectedLevelIndex >= levels.length) {
      selectedLevelIndex = 0;
    }
    populateLevelSelects();
    syncForm();
    draw();
  }

  function getSelectedLevelIndex() {
    return selectedLevelIndex;
  }

  window.PlatformerDesigner = {
    init,
    refresh,
    draw,
    saveLevel,
    getSelectedLevelIndex
  };
})();