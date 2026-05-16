#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const gameDataFormat = "platformer-lab-game-data";
const gameDataVersion = 1;
const tileSize = 32;

function usage() {
  console.log("Usage: node tools/build-game-data.js \"Game Name\" [--from path/to/source.game.json]");
  console.log("");
  console.log("Builds assets/game-data/<game-name>.game.json and sets index.html to load it by default.");
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "game-data";
}

function parseArgs(args) {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const name = args[0];
  let sourcePath = null;

  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--from") {
      sourcePath = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--from=")) {
      sourcePath = arg.slice("--from=".length);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!String(name || "").trim()) {
    throw new Error("Game name is required.");
  }
  if (sourcePath !== null && !String(sourcePath).trim()) {
    throw new Error("--from needs a source file path.");
  }

  return { name: String(name).trim(), sourcePath };
}

function normalizeLevel(level) {
  const source = level && typeof level === "object" ? level : {};
  const width = Math.max(8, Number(source.width) || 32);
  const height = Math.max(8, Number(source.height) || 17);
  const sourceTiles = Array.isArray(source.tiles) ? source.tiles : [];
  const tiles = Array.from({ length: height }, (_, row) => {
    const sourceRow = Array.isArray(sourceTiles[row]) ? sourceTiles[row] : [];
    return Array.from({ length: width }, (_, column) => Number(sourceRow[column]) || 0);
  });

  return {
    name: String(source.name || "Untitled Level").slice(0, 48),
    width,
    height,
    tileSize,
    tiles,
    objects: Array.isArray(source.objects) ? source.objects.map((object) => ({ ...object })) : []
  };
}

function normalizeSprite(sprite) {
  const source = sprite && typeof sprite === "object" ? sprite : {};
  const width = Math.max(1, Number(source.width) || 16);
  const height = Math.max(1, Number(source.height) || 16);
  const sourcePixels = Array.isArray(source.pixels) ? source.pixels : [];
  const pixels = Array.from({ length: height }, (_, row) => {
    const sourceRow = Array.isArray(sourcePixels[row]) ? sourcePixels[row] : [];
    return Array.from({ length: width }, (_, column) => sourceRow[column] || null);
  });

  return {
    name: String(source.name || "Sprite"),
    width,
    height,
    pixels
  };
}

function normalizeSprites(sprites) {
  const source = sprites && typeof sprites === "object" ? sprites : {};
  return Object.keys(source).reduce((normalized, key) => {
    normalized[key] = normalizeSprite(source[key]);
    return normalized;
  }, {});
}

function normalizeGameData(gameData, name) {
  const source = gameData && typeof gameData === "object" ? gameData : {};
  const sourceLevels = Array.isArray(source.levels) ? source.levels : [];
  const sourceSprites = source.sprites && typeof source.sprites === "object" ? source.sprites : {};

  if (sourceLevels.length === 0) {
    throw new Error("Game data must include at least one level.");
  }
  if (Object.keys(sourceSprites).length === 0) {
    throw new Error("Game data must include sprites.");
  }

  return {
    format: gameDataFormat,
    version: gameDataVersion,
    name: String(name || source.name || "Platformer Lab").slice(0, 64),
    levels: sourceLevels.map(normalizeLevel),
    sprites: normalizeSprites(sourceSprites)
  };
}

function loadDefaultsFromCode(projectRoot) {
  const defaultContentPath = path.join(projectRoot, "js", "default-content.js");
  const defaultContent = fs.readFileSync(defaultContentPath, "utf8");
  const context = { console, window: {} };
  vm.createContext(context);
  vm.runInContext(defaultContent, context, { filename: defaultContentPath });

  const defaults = context.window.PlatformerDefaults;
  if (!defaults) {
    throw new Error("Could not read PlatformerDefaults from js/default-content.js.");
  }

  if (typeof defaults.createDefaultGameData === "function") {
    return defaults.createDefaultGameData();
  }

  return {
    format: gameDataFormat,
    version: gameDataVersion,
    name: defaults.defaultGameName || "Platformer Lab",
    levels: defaults.createDefaultLevels(),
    sprites: defaults.defaultSprites
  };
}

function loadSourceGameData(projectRoot, sourcePath) {
  const resolvedSourcePath = path.resolve(projectRoot, sourcePath);
  const sourceContent = fs.readFileSync(resolvedSourcePath, "utf8");
  return JSON.parse(sourceContent);
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function updateIndexDefault(projectRoot, outputPath) {
  const indexPath = path.join(projectRoot, "index.html");
  const outputRelativePath = toPosixPath(path.relative(projectRoot, outputPath));
  const attribute = `data-game-data="${outputRelativePath}"`;
  const html = fs.readFileSync(indexPath, "utf8");
  let nextHtml;

  if (/data-game-data="[^"]*"/.test(html)) {
    nextHtml = html.replace(/data-game-data="[^"]*"/, attribute);
  } else if (/<body\b[^>]*>/.test(html)) {
    nextHtml = html.replace(/<body\b([^>]*)>/, `<body$1 ${attribute}>`);
  } else {
    throw new Error("Could not find a <body> tag in index.html.");
  }

  fs.writeFileSync(indexPath, nextHtml);
  return outputRelativePath;
}

function writeGameData(projectRoot, gameData) {
  const outputDirectory = path.join(projectRoot, "assets", "game-data");
  const outputPath = path.join(outputDirectory, `${slugify(gameData.name)}.game.json`);
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(gameData, null, 2)}\n`);
  return outputPath;
}

function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const { name, sourcePath } = parseArgs(process.argv.slice(2));
  const sourceGameData = sourcePath ? loadSourceGameData(projectRoot, sourcePath) : loadDefaultsFromCode(projectRoot);
  const gameData = normalizeGameData(sourceGameData, name);
  const outputPath = writeGameData(projectRoot, gameData);
  const outputRelativePath = updateIndexDefault(projectRoot, outputPath);

  console.log(`Built ${outputRelativePath}`);
  console.log(`Default game data set to ${outputRelativePath}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
