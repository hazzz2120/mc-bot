const mineflayer = require("mineflayer");
const express = require("express");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");

const app = express();

app.get("/", (_, res) => res.send("OK"));

app.get("/health", (_, res) => {
res.json({
status: "ok",
uptime: Math.floor(process.uptime())
});
});

app.listen(process.env.PORT || 3000);

const CONFIG = {
host: "furyvn.aternos.me",
port: 29776,
username: "dev.vianhdz",
auth: "offline",

version: false,

checkTimeoutInterval: 30000,
hideErrors: false
};

let bot = null;
let reconnectTimer = null;
let activityTimer = null;
let reconnectAttempts = 0;
let isConnecting = false;

function rand(min, max) {
return Math.random() * (max - min) + min;
}

function randInt(min, max) {
return Math.floor(rand(min, max));
}

function clearActivity() {
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
`[BOT] Reconnect in ${Math.round(delay / 1000)}s`
);

reconnectTimer = setTimeout(() => {
reconnectTimer = null;
createBot();
}, delay);
}

function startActivity(bot) {
const loop = () => {
if (!bot?.entity) {
activityTimer = setTimeout(loop, 10000);
return;
}

```
try {
  const pos = bot.entity.position;

  bot.look(
    Math.random() * Math.PI * 2,
    (Math.random() - 0.5) * 0.4,
    true
  );

  if (bot.pathfinder) {
    bot.pathfinder.setGoal(
      new goals.GoalNear(
        pos.x + randInt(-3, 3),
        pos.y,
        pos.z + randInt(-3, 3),
        1
      )
    );
  }

  if (Math.random() < 0.15) {
    bot.setControlState("jump", true);

    setTimeout(() => {
      try {
        bot.setControlState("jump", false);
      } catch {}
    }, 250);
  }
} catch (err) {
  console.log("[BOT]", err.message);
}

activityTimer = setTimeout(
  loop,
  rand(15000, 35000)
);
```

};

loop();
}

function createBot() {
if (isConnecting) return;

isConnecting = true;
clearActivity();

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

  startActivity(bot);
} catch (err) {
  console.log("[BOT] Pathfinder:", err.message);
}
```

});

bot.on("kicked", (reason) => {
console.log("[BOT] Kicked:", reason);
});

bot.on("error", (err) => {
if (
err?.code !== "ECONNRESET" &&
err?.code !== "ETIMEDOUT"
) {
console.log("[BOT] Error:", err.message);
}
});

bot.once("end", (reason) => {
console.log("[BOT] End:", reason);

```
clearActivity();

isConnecting = false;

scheduleReconnect();
```

});
}

process.on("uncaughtException", (err) => {
console.log("[UNCAUGHT]", err.message);
});

process.on("unhandledRejection", (err) => {
console.log("[UNHANDLED]", err);
});

createBot();
