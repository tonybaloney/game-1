(function () {
  "use strict";

  // sprites.js is deliberately small: sprites are just 2D arrays of colors, and
  // drawing a sprite means painting one rectangle for each non-transparent pixel.

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeSprite(sprite) {
    // Normalizing protects the renderer from half-finished sprite edits or old
    // saved data with missing rows and columns.
    const width = Math.max(1, Number(sprite.width) || 16);
    const height = Math.max(1, Number(sprite.height) || 16);
    const pixels = Array.from({ length: height }, (_, row) => {
      const sourceRow = Array.isArray(sprite.pixels) ? sprite.pixels[row] : [];
      return Array.from({ length: width }, (_, col) => sourceRow && sourceRow[col] ? sourceRow[col] : null);
    });

    return {
      name: sprite.name || "Sprite",
      width,
      height,
      pixels
    };
  }

  function normalizeSprites(sprites) {
    const normalized = {};
    Object.keys(sprites || {}).forEach((key) => {
      normalized[key] = normalizeSprite(sprites[key]);
    });
    return normalized;
  }

  function drawSprite(ctx, sprite, x, y, width, height, options) {
    // The same sprite data can draw at many sizes. Pixel art stays crisp because
    // every source pixel becomes a scaled rectangle.
    if (!sprite) {
      return;
    }

    const settings = options || {};
    const normalized = normalizeSprite(sprite);
    const pixelWidth = width / normalized.width;
    const pixelHeight = height / normalized.height;

    ctx.save();
    if (settings.flipX) {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      x = 0;
      y = 0;
    }

    for (let row = 0; row < normalized.height; row += 1) {
      for (let col = 0; col < normalized.width; col += 1) {
        const color = normalized.pixels[row][col];
        if (!color) {
          continue;
        }
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.floor(x + col * pixelWidth),
          Math.floor(y + row * pixelHeight),
          Math.ceil(pixelWidth),
          Math.ceil(pixelHeight)
        );
      }
    }
    ctx.restore();
  }

  function drawTile(ctx, sprites, tileTypes, tileId, x, y, size) {
    // Tiles prefer sprite art, but can fall back to a solid color while students
    // are adding or debugging new tile types.
    const tile = tileTypes.find((candidate) => candidate.id === tileId);
    if (!tile || tileId === 0) {
      return;
    }

    const sprite = tile.sprite ? sprites[tile.sprite] : null;
    if (sprite) {
      drawSprite(ctx, sprite, x, y, size, size);
      return;
    }

    ctx.fillStyle = tile.color || "#999999";
    ctx.fillRect(x, y, size, size);
  }

  window.PixelArt = {
    clone,
    normalizeSprite,
    normalizeSprites,
    drawSprite,
    drawTile
  };
})();