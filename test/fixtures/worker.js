import { setupWorker } from 'msw/browser'

export const worker = setupWorker()

console.log('=============== TEST ===============')
console.log(window.__test__)
console.log('=============== TEST ===============')
window.__test__ = window.__test__ || 'TEST'
