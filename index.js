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
  username: "dev.vianhdz",
  auth: "offline",
  version: "1.21.11",       // Fabric 1.21.11 — phải chỉ định rõ
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

  console.log("[vianhdz] đang kết nối");

  let bot;
  try {
    bot = mineflayer.createBot(CONFIG);
  } catch (err) {
    console.log("vianhdz] tạo bot lỗi:", err.message);
    isConnecting = false;
    scheduleReconnect();
    return;
  }

  bot.once("login", () => {
    isConnecting = false;
    console.log("[vianhdz] đã đăng nhập với tên", CONFIG.username);
  });

bot.once("spawn", () => {
  console.log("[vianh] Spawned — vòng lặp AFK bắt đầu");
  clearAfk();

  bot.clearControlStates();

  afkInterval = setInterval(() => {
    if (!bot.entity) return;

    const actions = ["forward", "back", "left", "right"];
    const action = actions[Math.floor(Math.random() * actions.length)];

    bot.setControlState(action, true);

    // nhảy random
    if (Math.random() < 0.3) {
      bot.setControlState("jump", true);
      setTimeout(() => bot.setControlState("jump", false), 300);
    }

    // quay đầu
    bot.look(
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.5,
      false
    );

    // dừng sau 1–3s
    setTimeout(() => {
      bot.clearControlStates();
    }, 1000 + Math.random() * 2000);

  }, 8000 + Math.random() * 7000);
});

  bot.on("error", (err) => {
    // Bỏ qua lỗi ECONNRESET thông thường để tránh log rác
    if (err.code !== "ECONNRESET" && err.code !== "ETIMEDOUT") {
      console.log("[BOT] Error:", err.message);
    }
  });

  bot.once("end", (reason) => {
  clearAfk();
  isConnecting = false;
  console.log("[BOT] Disconnected:", reason);
  scheduleReconnect();
  });
}

// ─── Reconnect an toàn (tránh double-reconnect) ───────────────────────────────
function scheduleReconnect() {
  if (reconnectTimer) return;

  const delay = 60000 + Math.random() * 60000; // 60–120s

  console.log(`[BOT] Reconnect in ${Math.round(delay/1000)}s`);

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
