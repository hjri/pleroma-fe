import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'

const target = 'node_modules/msw/lib/mockServiceWorker.js'

const mswPlugin = () => {
  let projectRoot
  return {
    name: 'msw-plugin',
    apply: 'serve',
    configResolved (conf) {
      projectRoot = conf.root
    },
    configureServer (server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.path === '/mockServiceWorker.js') {
          const file = await readFile(resolve(projectRoot, target))
          res.set('Content-Type', 'text/javascript')
          res.send(file)
        } else {
          next()
        }
      })
    }
  }
}

export default mswPlugin
