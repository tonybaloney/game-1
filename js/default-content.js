(function () {
  "use strict";

  const tileSize = 32;

  const tileTypes = [
    { id: 0, name: "Empty", sprite: null, solid: false, hazard: false, color: "#ffffff" },
    { id: 1, name: "Grass", sprite: "tileGrass", solid: true, hazard: false, color: "#4d9f38" },
    { id: 2, name: "Dirt", sprite: "tileDirt", solid: true, hazard: false, color: "#9b6232" },
    { id: 3, name: "Stone", sprite: "tileStone", solid: true, hazard: false, color: "#758195" },
    { id: 4, name: "Spikes", sprite: "tileSpike", solid: false, hazard: true, color: "#c93645" },
    { id: 5, name: "Spring", sprite: "tileSpring", solid: false, hazard: false, spring: true, color: "#e0b422" }
  ];

  const editorPalette = [
    null,
    "#172033",
    "#ffffff",
    "#d8ecff",
    "#f2b18c",
    "#e36d5d",
    "#f0bf3f",
    "#71bf45",
    "#168a55",
    "#2463eb",
    "#6d57d9",
    "#9b6232",
    "#613d2a",
    "#758195",
    "#c93645",
    "#2fb7c7"
  ];

  const legend = {
    ".": null,
    "K": "#172033",
    "W": "#ffffff",
    "B": "#2463eb",
    "b": "#1d4fbd",
    "S": "#f2b18c",
    "R": "#e36d5d",
    "Y": "#f0bf3f",
    "G": "#71bf45",
    "g": "#168a55",
    "D": "#9b6232",
    "d": "#613d2a",
    "M": "#758195",
    "m": "#4c5667",
    "C": "#2fb7c7",
    "P": "#6d57d9",
    "Q": "#c93645"
  };

  function spriteFromLines(name, lines) {
    return {
      name,
      width: lines[0].length,
      height: lines.length,
      pixels: lines.map((line) => Array.from(line, (ch) => legend[ch] || null))
    };
  }

  const defaultSprites = {
    player: spriteFromLines("Player", [
      "................",
      ".....KKKKKK.....",
      "....KSSSSSSK....",
      "....KSKSSKSK....",
      "....KSSSSSSK....",
      ".....KRRRRK.....",
      "....RRRBBRRR....",
      "...RRRBBBBRRR...",
      "...KKBBBBBBKK...",
      ".....BBBBBB.....",
      ".....BBBBBB.....",
      ".....BB..BB.....",
      ".....BB..BB.....",
      "....KK....KK....",
      "...KKK....KKK...",
      "................"
    ]),
    enemy: spriteFromLines("Enemy", [
      "................",
      "................",
      "......QQQQ......",
      "....QQQQQQQQ....",
      "...QQWQQQQWQQ...",
      "..QQQQQQQQQQQQ..",
      "..QQKQQQQQQKQQ..",
      "...QQQQQQQQQQ...",
      "....QQQQQQQQ....",
      ".....Q....Q.....",
      "....KK....KK....",
      "................"
    ]),
    coin: spriteFromLines("Coin", [
      "................",
      "................",
      "......YYYY......",
      "....YYYYYYYY....",
      "...YYYYWWYYYY...",
      "..YYYYYYYYYYYY..",
      "..YYYYYYYYYYYY..",
      "...YYYYYYYYYY...",
      "....YYYYYYYY....",
      "......YYYY......",
      "................",
      "................"
    ]),
    goal: spriteFromLines("Goal", [
      "KK..............",
      "KK.RRRRRRR......",
      "KK.RWWWRRR......",
      "KK.RRRRRRR......",
      "KK.RRR..........",
      "KK..............",
      "KK..............",
      "KK..............",
      "KK..............",
      "KK..............",
      "KK..............",
      "KK..............",
      "KK..............",
      "KK..............",
      "KK..............",
      "KK.............."
    ]),
    checkpoint: spriteFromLines("Checkpoint", [
      "................",
      ".......KK.......",
      ".......KK.......",
      ".......KK.......",
      ".....CCCCCC.....",
      "....CWWCCCC.....",
      ".....CCCCCC.....",
      ".......KK.......",
      ".......KK.......",
      ".......KK.......",
      ".......KK.......",
      "......KKKK......",
      ".....KKKKKK.....",
      "................",
      "................",
      "................"
    ]),
    powerUp: spriteFromLines("Power Up", [
      "................",
      "................",
      ".....PPPPPP.....",
      "....PPWWWWPP....",
      "...PPWWPPWWPP...",
      "...PPWWPPWWPP...",
      "...PPWWWWWWPP...",
      "....PPWWWWPP....",
      ".....PPPPPP.....",
      "................",
      "................",
      "................"
    ]),
    tileGrass: spriteFromLines("Grass Tile", [
      "GGGGGGGGGGGGGGGG",
      "GgGGgGGGgGGgGGgG",
      "DDDDDDDDDDDDDDDD",
      "DddDDddDDddDDddD",
      "DDDDDDDDDDDDDDDD",
      "DdDDdDDdDDdDDdDD",
      "DDDDDDDDDDDDDDDD",
      "DddDDDDddDDDDddD",
      "DDDDDDDDDDDDDDDD",
      "DdDDdDDdDDdDDdDD",
      "DDDDDDDDDDDDDDDD",
      "DddDDddDDddDDddD",
      "DDDDDDDDDDDDDDDD",
      "DdDDdDDdDDdDDdDD",
      "DDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDD"
    ]),
    tileDirt: spriteFromLines("Dirt Tile", [
      "DDDDDDDDDDDDDDDD",
      "DddDDddDDddDDddD",
      "DDDDDDDDDDDDDDDD",
      "DdDDdDDdDDdDDdDD",
      "DDDDDDDDDDDDDDDD",
      "DddDDDDddDDDDddD",
      "DDDDDDDDDDDDDDDD",
      "DdDDdDDdDDdDDdDD",
      "DDDDDDDDDDDDDDDD",
      "DddDDddDDddDDddD",
      "DDDDDDDDDDDDDDDD",
      "DdDDdDDdDDdDDdDD",
      "DDDDDDDDDDDDDDDD",
      "DddDDDDddDDDDddD",
      "DDDDDDDDDDDDDDDD",
      "DdDDdDDdDDdDDdDD"
    ]),
    tileStone: spriteFromLines("Stone Tile", [
      "MMMMMMMMMMMMMMMM",
      "MmmmmMMmmmmMMmmM",
      "MMMMMMMMMMMMMMMM",
      "MMmmmmMMmmmmMMmm",
      "MMMMMMMMMMMMMMMM",
      "MmmmmMMmmmmMMmmM",
      "MMMMMMMMMMMMMMMM",
      "MMmmmmMMmmmmMMmm",
      "MMMMMMMMMMMMMMMM",
      "MmmmmMMmmmmMMmmM",
      "MMMMMMMMMMMMMMMM",
      "MMmmmmMMmmmmMMmm",
      "MMMMMMMMMMMMMMMM",
      "MmmmmMMmmmmMMmmM",
      "MMMMMMMMMMMMMMMM",
      "MMmmmmMMmmmmMMmm"
    ]),
    tileSpike: spriteFromLines("Spike Tile", [
      "................",
      ".......M........",
      ".......M........",
      "......MMM.......",
      "......MMM.......",
      ".....MMMMM......",
      ".....MMMMM......",
      "....MMMMMMM.....",
      "....MMMWMMM.....",
      "...MMMMWMMMM....",
      "...MMMWMWMMM....",
      "..MMMWMMMWMMM...",
      "..MMMMMMMMMMMM..",
      ".MMMMMMMMMMMMMM.",
      "QQQQQQQQQQQQQQQQ",
      "QQQQQQQQQQQQQQQQ"
    ]),
    tileSpring: spriteFromLines("Spring Tile", [
      "................",
      "....YYYYYYYY....",
      "...YYYYYYYYYY...",
      "................",
      ".....CCCCCC.....",
      "....CCCCCCCC....",
      ".....CCCCCC.....",
      "....CCCCCCCC....",
      ".....CCCCCC.....",
      "....CCCCCCCC....",
      ".....CCCCCC.....",
      "................",
      "....YYYYYYYY....",
      "...YYYYYYYYYY...",
      "................",
      "................"
    ])
  };

  function makeBlankTiles(width, height) {
    return Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
  }

  function fillRect(tiles, x, y, width, height, id) {
    for (let row = y; row < y + height; row += 1) {
      for (let col = x; col < x + width; col += 1) {
        if (tiles[row] && col >= 0 && col < tiles[row].length) {
          tiles[row][col] = id;
        }
      }
    }
  }

  function makeLevel(name, width, height) {
    return {
      name,
      width,
      height,
      tileSize,
      tiles: makeBlankTiles(width, height),
      objects: []
    };
  }

  function createStarterLevel() {
    const level = makeLevel("Starter Run", 96, 17);
    const tiles = level.tiles;

    fillRect(tiles, 0, 14, 96, 3, 2);
    fillRect(tiles, 0, 13, 12, 1, 1);
    fillRect(tiles, 16, 13, 13, 1, 1);
    fillRect(tiles, 33, 13, 13, 1, 1);
    fillRect(tiles, 52, 13, 11, 1, 1);
    fillRect(tiles, 70, 13, 26, 1, 1);
    fillRect(tiles, 12, 14, 4, 1, 0);
    fillRect(tiles, 29, 14, 4, 1, 0);
    fillRect(tiles, 46, 14, 6, 1, 0);
    fillRect(tiles, 63, 14, 7, 1, 0);
    fillRect(tiles, 20, 10, 6, 1, 3);
    fillRect(tiles, 36, 9, 5, 1, 3);
    fillRect(tiles, 48, 11, 4, 1, 3);
    fillRect(tiles, 59, 8, 6, 1, 3);
    fillRect(tiles, 75, 10, 5, 1, 3);

    tiles[13][30] = 4;
    tiles[13][31] = 4;
    tiles[13][47] = 4;
    tiles[13][48] = 4;
    tiles[13][49] = 4;
    tiles[13][64] = 4;
    tiles[13][65] = 4;
    tiles[12][54] = 5;

    level.objects = [
      { type: "start", x: 2, y: 13 },
      { type: "coin", x: 7, y: 11 },
      { type: "coin", x: 21, y: 8 },
      { type: "coin", x: 24, y: 8 },
      { type: "coin", x: 38, y: 7 },
      { type: "coin", x: 50, y: 9 },
      { type: "coin", x: 61, y: 6 },
      { type: "coin", x: 78, y: 8 },
      { type: "enemy", x: 18, y: 12, direction: 1 },
      { type: "enemy", x: 72, y: 12, direction: -1 },
      { type: "checkpoint", x: 55, y: 12 },
      { type: "powerUp", x: 60, y: 6 },
      { type: "goal", x: 92, y: 11 }
    ];

    return level;
  }

  function createSkyStepsLevel() {
    const level = makeLevel("Sky Steps", 118, 17);
    const tiles = level.tiles;

    fillRect(tiles, 0, 14, 118, 3, 2);
    fillRect(tiles, 0, 13, 10, 1, 1);
    fillRect(tiles, 10, 14, 12, 1, 0);
    fillRect(tiles, 28, 14, 9, 1, 0);
    fillRect(tiles, 50, 14, 9, 1, 0);
    fillRect(tiles, 78, 14, 8, 1, 0);
    fillRect(tiles, 100, 14, 6, 1, 0);
    fillRect(tiles, 16, 11, 5, 1, 3);
    fillRect(tiles, 25, 9, 4, 1, 3);
    fillRect(tiles, 36, 10, 6, 1, 3);
    fillRect(tiles, 46, 8, 4, 1, 3);
    fillRect(tiles, 60, 11, 6, 1, 3);
    fillRect(tiles, 70, 9, 4, 1, 3);
    fillRect(tiles, 86, 12, 5, 1, 3);
    fillRect(tiles, 96, 10, 5, 1, 3);
    fillRect(tiles, 106, 8, 4, 1, 3);

    [22, 23, 37, 52, 53, 54, 79, 80, 101].forEach((x) => {
      tiles[13][x] = 4;
    });
    tiles[13][67] = 5;

    level.objects = [
      { type: "start", x: 2, y: 13 },
      { type: "coin", x: 17, y: 9 },
      { type: "coin", x: 26, y: 7 },
      { type: "coin", x: 39, y: 8 },
      { type: "coin", x: 48, y: 6 },
      { type: "coin", x: 63, y: 9 },
      { type: "coin", x: 72, y: 7 },
      { type: "coin", x: 88, y: 10 },
      { type: "coin", x: 98, y: 8 },
      { type: "coin", x: 108, y: 6 },
      { type: "enemy", x: 32, y: 12, direction: 1 },
      { type: "enemy", x: 90, y: 11, direction: -1 },
      { type: "checkpoint", x: 61, y: 10 },
      { type: "powerUp", x: 47, y: 6 },
      { type: "goal", x: 113, y: 11 }
    ];

    return level;
  }

  function createDefaultLevels() {
    return [createStarterLevel(), createSkyStepsLevel()];
  }

  window.PlatformerDefaults = {
    tileSize,
    tileTypes,
    editorPalette,
    defaultSprites,
    createDefaultLevels,
    makeLevel,
    makeBlankTiles
  };
})();