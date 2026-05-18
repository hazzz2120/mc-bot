const mineflayer = require("mineflayer");
const express = require("express");

// =====================
// KEEP ALIVE SERVER (Railway)
// =====================
const app = express();
app.get("/", (req, res) => res.send("OK"));
app.listen(process.env.PORT || 3000);

// =====================
// CONFIG
// =====================
const CONFIG = {
  host: "furyvn.aternos.me",
  port: 29776,
  username: "vianhdz",
  auth: "offline",
  version: "1.21.11" // ⚠️ đổi đúng version server
};

// =====================
// BOT FUNCTION
// =====================
function createBot() {
  console.log("[BOT] Starting...");

  const bot = mineflayer.createBot(CONFIG);

  // =====================
  // DEBUG LOGS (QUAN TRỌNG)
  // =====================
  bot.on("login", () => {
    console.log("[BOT] Logged in");
  });

  bot.on("spawn", () => {
    console.log("[BOT] Spawned in world");

    // ổn định camera (không spam physics hack)
    bot.look(0, 0, true);
    bot.clearControlStates();
  });

  bot.on("kicked", (reason) => {
    console.log("[BOT] KICKED:", reason);
  });

  bot.on("error", (err) => {
    console.log("[BOT] ERROR:", err);
  });

  bot.on("end", (reason) => {
    console.log("[BOT] DISCONNECTED:", reason || "unknown");

    // reconnect an toàn
    setTimeout(() => {
      createBot();
    }, 15000);
  });

  // =====================
  // ANTI CRASH (nhưng không che lỗi quan trọng)
  // =====================
  process.on("uncaughtException", (err) => {
    console.log("[PROCESS ERROR]", err);
  });

  process.on("unhandledRejection", (err) => {
    console.log("[PROMISE ERROR]", err);
  });
}

// start bot
createBot();