const mineflayer = require("mineflayer");
const express = require("express");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");

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
  version: false,            // auto-detect protocol từ server, tránh hardcode sai version
  checkTimeoutInterval: 30000,
  closeTimeout: 300,
  hideErrors: false,
};

const SPAWN_TIMEOUT_MS = 60000; // nếu login rồi mà không spawn trong 60s -> coi như treo, reconnect

// ─── Biến quản lý state ───────────────────────────────────────────────────────
let humanBehaviorTimer = null;
let spawnWatchdog = null;
let reconnectTimer = null;
let isConnecting = false;

// ─── Hàm dọn dẹp khi disconnect ───────────────────────────────────────────────
function clearTimers() {
  if (humanBehaviorTimer) {
    clearTimeout(humanBehaviorTimer);
    humanBehaviorTimer = null;
  }
  if (spawnWatchdog) {
    clearTimeout(spawnWatchdog);
    spawnWatchdog = null;
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
    console.log("[vianhdz] tạo bot lỗi:", err.message);
    isConnecting = false;
    scheduleReconnect();
    return;
  }

  bot.once("login", () => {
    isConnecting = false;
    console.log("[vianhdz] đã đăng nhập với tên", CONFIG.username);

    // Watchdog: nếu spawn không bao giờ tới, đừng để bot treo vô thời hạn
    spawnWatchdog = setTimeout(() => {
      console.log("[vianhdz] không spawn sau", SPAWN_TIMEOUT_MS / 1000, "s, ép reconnect");
      bot.end("spawn_timeout");
    }, SPAWN_TIMEOUT_MS);
  });

  bot.once("spawn", () => {
    if (spawnWatchdog) {
      clearTimeout(spawnWatchdog);
      spawnWatchdog = null;
    }

    console.log("[vianhdz] Human mode ON");

    bot.loadPlugin(pathfinder);

    const mcData = require("minecraft-data")(bot.version);
    const defaultMove = new Movements(bot, mcData);
    bot.pathfinder.setMovements(defaultMove);

    const chatMessages = [
      "hí ae",
      "lag à?",
      "đang farm",
      "ai ở đâu",
      "vcl đông vậy",
      "tin nhắn tự động của bot th ae đừng qtam",
      " anh ộ i i",
      "nà ná na na",
      " chan bo may di",
      " bạn sợ à ? ",
      " bo may can tat",
      " lạy bố ",
      " chịu chết",
      " em cảm ơn anh, anh ộ i i",
      " anh là aiiiiii",
      " Phùng Thanh Đọoooooo",
    ];

    function randomDelay(min, max) {
      return min + Math.random() * (max - min);
    }

    function sleep(ms) {
      return new Promise((res) => setTimeout(res, ms));
    }

    async function humanBehavior() {
      if (!bot.entity) return;

      try {
        // ─── 1. Đi tới vị trí random (có mục đích) ───
        const dx = Math.floor(Math.random() * 10 - 5);
        const dz = Math.floor(Math.random() * 10 - 5);
        const x = bot.entity.position.x + dx;
        const y = bot.entity.position.y;
        const z = bot.entity.position.z + dz;

        bot.pathfinder.setGoal(new goals.GoalNear(x, y, z, 1));

        await sleep(randomDelay(3000, 7000));

        // ─── 2. Nhìn quanh ───
        bot.look(
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.5,
          false
        );

        // ─── 3. Random chat (ít thôi) ───
        if (Math.random() < 0.15) {
          const msg = chatMessages[Math.floor(Math.random() * chatMessages.length)];
          bot.chat(msg);
        }

        // ─── 4. Đào block ngẫu nhiên ───
        if (Math.random() < 0.3) {
          const block = bot.blockAt(bot.entity.position.offset(0, -1, 0));

          if (
            block &&
            bot.canDigBlock(block) &&
            (block.name.includes("dirt") || block.name.includes("stone"))
          ) {
            await bot.dig(block);
            await sleep(randomDelay(1000, 3000));
          }
        }

        // ─── 5. Idle ───
        if (Math.random() < 0.3) {
          await sleep(randomDelay(2000, 6000));
        }

        // ─── 6. Nhảy ngẫu nhiên ───
        if (Math.random() < 0.3) {
          bot.setControlState("jump", true);
          setTimeout(() => bot.setControlState("jump", false), 300);
        }
      } catch (err) {
        console.log("[vianhdz] humanBehavior lỗi:", err.message);
      }

      humanBehaviorTimer = setTimeout(humanBehavior, randomDelay(4000, 10000));
    }

    humanBehaviorTimer = setTimeout(humanBehavior, 0);
  });

  bot.on("death", () => {
    console.log("[vianhdz] bot chết, respawn");
    setTimeout(() => {
      try {
        bot.respawn();
      } catch (err) {
        console.log("[vianhdz] respawn lỗi:", err.message);
      }
    }, 1000);
  });

  bot.on("kicked", (reason) => {
    console.log("[vianhdz] bị kick:", reason);
  });

  bot.on("error", (err) => {
    if (err.code !== "ECONNRESET" && err.code !== "ETIMEDOUT") {
      console.log("[BOT] Error:", err.message);
    }
  });

  bot.once("end", (reason) => {
    clearTimers();
    isConnecting = false;
    console.log("[BOT] Disconnected:", reason);
    scheduleReconnect();
  });
}

// ─── Reconnect an toàn (tránh double-reconnect) ───────────────────────────────
function scheduleReconnect() {
  if (reconnectTimer) return;

  const delay = 60000 + Math.random() * 60000; // 60–120s

  console.log(`[BOT] Reconnect in ${Math.round(delay / 1000)}s`);

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
