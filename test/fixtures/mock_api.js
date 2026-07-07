import { test as testBase } from 'vitest'

import { worker } from './worker.js'

export const test = testBase.extend({
  worker: [
    // biome-ignore lint: required by vitest
    async ({}, use) => {
      await worker.start()

      await use(worker)

      worker.resetHandlers()
    },
    {
      auto: true,
    },
  ],
})
