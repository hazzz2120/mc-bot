const mineflayer = require("mineflayer");
const express = require("express");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");

// ============================================================================
// HTTP SERVER (Railway Health Check)
// ============================================================================

const app = express();

app.get("/", (req, res) => {
res.send("Minecraft Bot Running");
});

app.get("/health", (req, res) => {
res.json({
status: "ok",
uptime: Math.floor(process.uptime()),
memory: process.memoryUsage().rss,
timestamp: Date.now(),
});
});

app.listen(process.env.PORT || 3000, () => {
console.log("[WEB] Health server started");
});

// ============================================================================
// CONFIG
// ============================================================================

const CONFIG = {
host: "furyvn.aternos.me",
port: 29776,
username: "dev.vianhdz",

auth: "offline",

// Nếu lỗi version hãy thử false
version: false,

checkTimeoutInterval: 30000,
hideErrors: false,
};

// ============================================================================
// STATE
// ============================================================================

let bot = null;

let reconnectTimer = null;
let activityTimer = null;

let reconnectAttempts = 0;
let isConnecting = false;

// ============================================================================
// HELPERS
// ============================================================================

function random(min, max) {
return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
return Math.floor(random(min, max));
}

function clearTimers() {
if (activityTimer) {
clearTimeout(activityTimer);
activityTimer = null;
}
}

function scheduleReconnect() {
if (reconnectTimer) return;

reconnectAttempts++;

const delay = Math.min(
15 * 60 * 1000,
Math.pow(2, reconnectAttempts) * 30000
);

console.log(
`[RECONNECT] attempt=${reconnectAttempts} delay=${Math.round(
      delay / 1000
    )}s`
);

reconnectTimer = setTimeout(() => {
reconnectTimer = null;
createBot();
}, delay);
}

// ============================================================================
// ACTIVITY LOOP
// ============================================================================

function startActivityLoop(botInstance) {
function loop() {
if (!botInstance?.entity) {
activityTimer = setTimeout(loop, 10000);
return;
}

```
try {
  const pos = botInstance.entity.position;

  const x = pos.x + randomInt(-3, 3);
  const z = pos.z + randomInt(-3, 3);

  botInstance.look(
    Math.random() * Math.PI * 2,
    (Math.random() - 0.5) * 0.4,
    true
  );

  if (botInstance.pathfinder) {
    botInstance.pathfinder.setGoal(
      new goals.GoalNear(x, pos.y, z, 1)
    );
  }

  if (Math.random() < 0.2) {
    botInstance.setControlState("jump", true);

    setTimeout(() => {
      try {
        botInstance.setControlState("jump", false);
      } catch {}
    }, 250);
  }
} catch (err) {
  console.log("[ACTIVITY]", err.message);
}

activityTimer = setTimeout(
  loop,
  random(15000, 35000)
);
```

}

loop();
}

// ============================================================================
// BOT
// ============================================================================

function createBot() {
if (isConnecting) return;

isConnecting = true;

clearTimers();

console.log("[BOT] Connecting...");

try {
bot = mineflayer.createBot(CONFIG);

```
bot.loadPlugin(pathfinder);
```

} catch (err) {
console.log("[BOT] Create failed:", err.message);

```
isConnecting = false;

scheduleReconnect();
return;
```

}

bot.once("login", () => {
console.log("[BOT] Logged in");

```
reconnectAttempts = 0;
isConnecting = false;
```

});

bot.once("spawn", () => {
console.log("[BOT] Spawned");

```
try {
  const mcData = require("minecraft-data")(bot.version);

  const movements = new Movements(bot, mcData);

  bot.pathfinder.setMovements(movements);

  startActivityLoop(bot);
} catch (err) {
  console.log("[BOT] Pathfinder error:", err.message);
}
```

});

bot.on("kicked", (reason) => {
console.log("[KICKED]", reason);
});

bot.on("error", (err) => {
if (
err.code !== "ECONNRESET" &&
err.code !== "ETIMEDOUT"
) {
console.log("[ERROR]", err.message);
}
});

bot.once("end", (reason) => {
console.log("[END]", reason);

```
clearTimers();

isConnecting = false;

scheduleReconnect();
```

});
}

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================

process.on("uncaughtException", (err) => {
console.log("[UNCAUGHT]", err.message);
});

process.on("unhandledRejection", (err) => {
console.log("[UNHANDLED]", err);
});

// ============================================================================
// START
// ============================================================================

createBot();
