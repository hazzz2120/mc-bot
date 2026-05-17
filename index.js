const mineflayer = require('mineflayer')

function createBot() {
  const bot = mineflayer.createBot({
    host: 'furyvn.aternos.me',
    port: 29776,
    username: 'vianhdzai',
    version: false // auto detect
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

  // 👉 thêm anti AFK
  setInterval(() => {
    if (bot.entity) {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 500)
    }
  }, 10000)
}

createBot()
