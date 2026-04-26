import { app } from './app.js'
import './workers/notification-worker.js' // 🚀 Inicia o processamento de WhatsApp
import './workers/email-worker.js' // 📧 Inicia o processamento de E-mails

const port = Number(process.env.PORT) || 3334

app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  console.log(`🚀 SaaS Platform & Worker active on port ${port}`)
})
