import { app } from './app.js'

// 🛡️ DINAMISMO: Usa a porta definida pelo provedor (Render/Railway) ou 3334 localmente
const port = Number(process.env.PORT) || 3334

app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  console.log(`🚀 Server active on port ${port}`)
})
