const mineflayer = require('mineflayer')
const express = require('express')

const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Bot is running')
})

app.listen(PORT, () => {
  console.log('Web server chạy ở port', PORT)
})

// ===== BOT =====
function createBot() {
  const bot = mineflayer.createBot({
    host: 'Ifuryvn.aternos.me',
    port: 29776,
    username: 'TenBot',
    version: false
  })

  bot.on('login', () => {
    console.log('Bot đã vào server')
  })

  bot.on('end', () => {
    console.log('Bot bị disconnect, reconnect sau 5s...')
    setTimeout(createBot, 5000)
  })

  bot.on('error', (err) => {
    console.log('Lỗi:', err)
  })
}

createBot()