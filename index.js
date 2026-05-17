const mineflayer = require('mineflayer')

function createBot() {
  const bot = mineflayer.createBot({
    host: 'furyvn.aternos.me', // ví dụ: abc.aternos.me
    port: 29776,
    username: 'BotAFK'
  })

  bot.on('spawn', () => {
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
