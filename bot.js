const mineflayer = require('mineflayer')

const bot = mineflayer.createBot({
  host: 'furyvn.aternos.me', // ví dụ: abc.aternos.me
  port: 29776,
  username: 'Bot_AFK_01' // tên bot
})

bot.on('spawn', () => {
  console.log('Bot đã vào server!')

  setInterval(() => {
    bot.setControlState('jump', true)
    setTimeout(() => bot.setControlState('jump', false), 500)
  }, 10000)
})


bot.on('end', () => {
  console.log('Bot bị kick, đang vào lại...')
  setTimeout(createBot, 5000)
})

function createBot() {
  const newBot = mineflayer.createBot({
    host: 'furyvn.aternos.me',
    port: 29776,
    username: 'Bot_AFK_01'
  })
}