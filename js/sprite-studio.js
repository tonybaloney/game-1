(function () {
  "use strict";

  let canvas;
  let ctx;
  let previewCanvas;
  let previewCtx;
  let sprites = {};
  let selectedKey = "player";
  let selectedColor = null;
  let isPainting = false;
  let onChange = function () {};
  let elements = {};

  function currentSprite() {
    return sprites[selectedKey];
  }

  function populateSpriteSelect() {
    elements.spriteSelect.innerHTML = "";
    Object.keys(sprites).forEach((key) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = sprites[key].name || key;
      elements.spriteSelect.appendChild(option);
    });
    if (!sprites[selectedKey]) {
      selectedKey = Object.keys(sprites)[0];
    }
    elements.spriteSelect.value = selectedKey;
  }

  function renderPalette() {
    elements.paletteButtons.innerHTML = "";
    window.PlatformerDefaults.editorPalette.forEach((color, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "palette-button";
      button.title = color || "Transparent";
      button.dataset.index = String(index);
      if (color) {
        button.style.background = color;
      } else {
        button.classList.add("transparent-swatch");
      }
      button.addEventListener("click", () => {
        selectedColor = color;
        markPalette();
      });
      elements.paletteButtons.appendChild(button);
    });
    markPalette();
  }

  function markPalette() {
    elements.paletteButtons.querySelectorAll("button").forEach((button) => {
      const color = window.PlatformerDefaults.editorPalette[Number(button.dataset.index)];
      button.classList.toggle("is-active", color === selectedColor);
    });
  }

  function cellFromPointer(event) {
    const sprite = currentSprite();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    return {
      col: Math.floor(x / (canvas.width / sprite.width)),
      row: Math.floor(y / (canvas.height / sprite.height))
    };
  }

  function paint(event) {
    const sprite = currentSprite();
    const cell = cellFromPointer(event);
    if (!sprite || cell.col < 0 || cell.row < 0 || cell.col >= sprite.width || cell.row >= sprite.height) {
      return;
    }
    sprite.pixels[cell.row][cell.col] = selectedColor;
    draw();
  }

  function drawTransparentBackground(targetCtx, width, height, size) {
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        targetCtx.fillStyle = ((x / size + y / size) % 2 === 0) ? "#ffffff" : "#dce5ef";
        targetCtx.fillRect(x, y, size, size);
      }
    }
  }

  function drawEditor() {
    const sprite = currentSprite();
    if (!sprite) {
      return;
    }

    drawTransparentBackground(ctx, canvas.width, canvas.height, 24);
    window.PixelArt.drawSprite(ctx, sprite, 0, 0, canvas.width, canvas.height);

    const cellWidth = canvas.width / sprite.width;
    const cellHeight = canvas.height / sprite.height;
    ctx.strokeStyle = "rgba(23, 32, 51, 0.22)";
    ctx.lineWidth = 1;
    for (let col = 0; col <= sprite.width; col += 1) {
      const x = Math.floor(col * cellWidth) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let row = 0; row <= sprite.height; row += 1) {
      const y = Math.floor(row * cellHeight) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function drawPreview() {
    const sprite = currentSprite();
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    drawTransparentBackground(previewCtx, previewCanvas.width, previewCanvas.height, 16);
    if (!sprite) {
      return;
    }
    window.PixelArt.drawSprite(previewCtx, sprite, 36, 36, 88, 88);
  }

  function draw() {
    drawEditor();
    drawPreview();
  }

  function saveSprites() {
    window.PlatformerStorage.saveSprites(sprites);
    onChange(sprites);
  }

  function resetSprites() {
    sprites = window.PlatformerStorage.resetSprites();
    selectedKey = "player";
    populateSpriteSelect();
    draw();
    saveSprites();
  }

  function init(options) {
    canvas = options.canvas;
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    previewCanvas = options.previewCanvas;
    previewCtx = previewCanvas.getContext("2d");
    previewCtx.imageSmoothingEnabled = false;
    sprites = options.sprites;
    onChange = options.onChange || onChange;
    elements = options.elements;

    populateSpriteSelect();
    renderPalette();

    elements.spriteSelect.addEventListener("change", () => {
      selectedKey = elements.spriteSelect.value;
      draw();
    });
    canvas.addEventListener("pointerdown", (event) => {
      isPainting = true;
      canvas.setPointerCapture(event.pointerId);
      paint(event);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (isPainting) {
        paint(event);
      }
    });
    canvas.addEventListener("pointerup", () => {
      isPainting = false;
    });
    canvas.addEventListener("pointercancel", () => {
      isPainting = false;
    });
    elements.saveButton.addEventListener("click", saveSprites);
    elements.resetButton.addEventListener("click", resetSprites);
    elements.exportButton.addEventListener("click", () => {
      saveSprites();
      window.PlatformerStorage.downloadJson("platformer-lab-sprites.json", sprites);
    });
    elements.importButton.addEventListener("click", () => elements.fileInput.click());
    elements.fileInput.addEventListener("change", () => {
      const file = elements.fileInput.files[0];
      if (!file) {
        return;
      }
      window.PlatformerStorage.readJsonFile(file, (json) => {
        sprites = window.PixelArt.normalizeSprites(json);
        selectedKey = Object.keys(sprites)[0] || "player";
        populateSpriteSelect();
        draw();
        saveSprites();
      }, () => window.PlatformerApp.toast("Could not import that sprite file."));
      elements.fileInput.value = "";
    });

    draw();
  }

  function refresh(nextSprites) {
    sprites = nextSprites;
    populateSpriteSelect();
    draw();
  }

  window.PlatformerSpriteStudio = {
    init,
    refresh,
    draw,
    saveSprites
  };
})();