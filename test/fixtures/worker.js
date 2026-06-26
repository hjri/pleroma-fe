import { setupWorker } from 'msw/browser'

export const worker = setupWorker()

window.__test__ = window.__test__ || 'TEST'
