#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const port = Number(process.argv[2]) || 8080;
const gameDataFormat = "platformer-lab-game-data";
const gameDataVersion = 1;
const maxBodyBytes = 8 * 1024 * 1024;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav"
};

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "game-data";
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function send(response, status, body, type) {
  response.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8" });
  response.end(body);
}

function sendJson(response, status, value) {
  send(response, status, JSON.stringify(value), "application/json; charset=utf-8");
}

function isInsideProject(filePath) {
  const relative = path.relative(projectRoot, filePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function readRequestJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > maxBodyBytes) {
        reject(new Error("Game data is too large."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function normalizeGameData(input) {
  const source = input && typeof input === "object" ? input : {};
  if (!Array.isArray(source.levels) || source.levels.length === 0) {
    throw new Error("Game data must include at least one level.");
  }
  if (!source.sprites || typeof source.sprites !== "object" || Object.keys(source.sprites).length === 0) {
    throw new Error("Game data must include sprites.");
  }

  return {
    format: gameDataFormat,
    version: gameDataVersion,
    name: String(source.name || "Platformer Lab").trim().slice(0, 64) || "Platformer Lab",
    levels: source.levels,
    sprites: source.sprites
  };
}

function updateIndexDefault(outputPath) {
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

function writeGameData(gameData) {
  const outputDirectory = path.join(projectRoot, "assets", "game-data");
  const outputPath = path.join(outputDirectory, `${slugify(gameData.name)}.game.json`);
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(gameData, null, 2)}\n`);
  return {
    filePath: outputPath,
    relativePath: updateIndexDefault(outputPath)
  };
}

async function handleSaveGameData(request, response) {
  try {
    const body = await readRequestJson(request);
    const gameData = normalizeGameData(body.gameData || body);
    const output = writeGameData(gameData);
    sendJson(response, 200, {
      ok: true,
      path: output.relativePath,
      name: gameData.name
    });
    console.log(`Saved ${output.relativePath}`);
  } catch (error) {
    sendJson(response, 400, { ok: false, error: error.message });
  }
}

function serveFile(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const requestPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.resolve(projectRoot, `.${requestPath}`);

  if (!isInsideProject(filePath)) {
    send(response, 403, "Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      send(response, 404, "Not found");
      return;
    }

    const type = contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": type });
    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/api/game-data") {
    handleSaveGameData(request, response);
    return;
  }

  if (request.method === "GET" || request.method === "HEAD") {
    serveFile(request, response);
    return;
  }

  send(response, 405, "Method not allowed");
});

server.listen(port, () => {
  console.log(`Platformer Lab dev server: http://localhost:${port}`);
  console.log("Build Game Data will save directly into assets/game-data/ on this server.");
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Try: node tools/dev-server.js ${port + 1}`);
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
});
