const mineflayer = require("mineflayer");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("OK"));
app.listen(process.env.PORT || 3000);

const CONFIG = {
  host: "furyvn.aternos.me",
  port: 29776,
  username: "vianhdz",
  auth: "offline",

  version: false
};

function createBot() {
  console.log("[BOT] Starting...");

  const bot = mineflayer.createBot(CONFIG);

  bot.on("login", () => {
    console.log("[BOT] Logged in");
  });

  bot.on("spawn", () => {
    console.log("[BOT] Spawned");

    bot.look(0, 0, true);
    bot.clearControlStates();

  setInterval(() => {
    if (!bot.entity) return;

    bot.setControlState("jump", true);
    setTimeout(() => bot.setControlState("jump", false), 150);

    const yaw = Math.random() * Math.PI * 2;
    bot.look(yaw, 0, true);

  }, 20000);
});

  bot.on("kicked", (reason) => {
    console.log("[BOT] KICKED:", reason?.toString?.() || reason);
  });

  bot.on("error", (err) => {
    console.log("[BOT ERROR]", err);
  });

  bot.on("end", () => {
    console.log("[BOT] Disconnected → reconnect 15s");

    setTimeout(createBot, 15000);
  });
}

process.on("uncaughtException", console.log);
process.on("unhandledRejection", console.log);

createBot();