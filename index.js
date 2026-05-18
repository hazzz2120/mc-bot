const mineflayer = require("mineflayer");
const express = require("express");

// ─── Keep-alive server cho Railway ───────────────────────────────────────────
const app = express();
app.get("/", (_req, res) => res.send("OK"));
app.listen(process.env.PORT || 3000);

// ─── Cấu hình bot ────────────────────────────────────────────────────────────
const CONFIG = {
  host: "furyvn.aternos.me",
  port: 29776,
  username: "vianhdz",
  auth: "offline",
  version: "1.21.1",        // Fabric 1.21.1 — phải chỉ định rõ
  checkTimeoutInterval: 30000,
  closeTimeout: 300,
  hideErrors: false,
};

// ─── Biến quản lý state ───────────────────────────────────────────────────────
let afkInterval = null;
let reconnectTimer = null;
let isConnecting = false;

// ─── Hàm dọn dẹp interval khi disconnect ─────────────────────────────────────
function clearAfk() {
  if (afkInterval) {
    clearInterval(afkInterval);
    afkInterval = null;
  }
}

// ─── Tạo bot ──────────────────────────────────────────────────────────────────
function createBot() {
  if (isConnecting) return;
  isConnecting = true;

  console.log("[BOT] Connecting...");

  let bot;
  try {
    bot = mineflayer.createBot(CONFIG);
  } catch (err) {
    console.log("[BOT] createBot error:", err.message);
    isConnecting = false;
    scheduleReconnect();
    return;
  }

  bot.once("login", () => {
    isConnecting = false;
    console.log("[BOT] Logged in as", CONFIG.username);
  });

  bot.once("spawn", () => {
    console.log("[BOT] Spawned — AFK loop started");
    clearAfk(); // phòng trường hợp spawn lại

    bot.clearControlStates();

    // AFK: nhảy nhẹ + xoay ngẫu nhiên mỗi 25 giây
    // (đủ để chống kick, không cần dày hơn)
    afkInterval = setInterval(() => {
      if (!bot.entity) return;

      bot.setControlState("jump", true);
      setTimeout(() => {
        if (bot.entity) bot.setControlState("jump", false);
      }, 200);

      // Xoay đầu ngẫu nhiên để tránh bị detect là bot đứng yên
      bot.look(Math.random() * Math.PI * 2, 0, false);

    }, 25000);
  });

  bot.on("kicked", (reason) => {
    const msg = typeof reason === "string" ? reason : JSON.stringify(reason);
    console.log("[BOT] Kicked:", msg.slice(0, 200));
  });

  bot.on("error", (err) => {
    // Bỏ qua lỗi ECONNRESET thông thường để tránh log rác
    if (err.code !== "ECONNRESET" && err.code !== "ETIMEDOUT") {
      console.log("[BOT] Error:", err.message);
    }
  });

  bot.once("end", (reason) => {
    console.log("[BOT] Disconnected:", reason, "→ reconnect in 15s");
    clearAfk();
    isConnecting = false;
    scheduleReconnect();
  });
}

// ─── Reconnect an toàn (tránh double-reconnect) ───────────────────────────────
function scheduleReconnect(delay = 15000) {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createBot();
  }, delay);
}

// ─── Bắt lỗi toàn cục (không crash Railway) ──────────────────────────────────
process.on("uncaughtException", (err) => {
  console.log("[UNCAUGHT]", err.message);
});
process.on("unhandledRejection", (reason) => {
  console.log("[UNHANDLED]", reason);
});

// ─── Khởi động ────────────────────────────────────────────────────────────────
createBot();
