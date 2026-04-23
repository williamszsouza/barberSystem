import { app } from './app.js'

app.listen({ port: 3334, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  console.log('🚀 Server active on port 3334')
})
