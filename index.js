const mineflayer = require("mineflayer")
const express = require("express")

// giữ server sống (Railway không sleep)
const app = express()
app.get("/", (req, res) => res.send("OK"))
app.listen(process.env.PORT || 3000)

// anti crash
process.on("uncaughtException", () => {})
process.on("unhandledRejection", () => {})

function createBot() {
  console.log("Creating bot...")

  const bot = mineflayer.createBot({
    host: "furyvn.aternos.me",
    port: 29776,
    username: "vianhdz",
    auth: "offline",
    version: false
  })

  // giảm load ngay khi login
  bot.once("login", () => {
    console.log("Logged in")

    bot._client.write("settings", {
      locale: "en_US",
      viewDistance: 2,   // cực thấp
      chatFlags: 0,
      chatColors: false,
      skinParts: 0,
      mainHand: 1
    })
  })

  bot.once("spawn", () => {
    console.log("Bot spawned")

    // đứng yên hoàn toàn = CPU gần 0
    bot.clearControlStates()
    bot.look(0, 0, true)

    // 🔥 QUAN TRỌNG: tắt xử lý entity (giảm CPU mạnh)
    bot.entities = {}

    // 🔥 chặn physics loop
    bot.physicsEnabled = false
  })

  // reconnect chậm lại (đỡ tốn CPU)
  bot.on("end", () => {
    console.log("Disconnected → reconnect sau 30s")
    setTimeout(createBot, 30000)
  })

  // tránh spam log (tốn CPU)
  bot.on("error", () => {})
}

createBot()