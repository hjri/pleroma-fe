import EventTargetPolyfill from '@ungap/event-target'

try {
  const et = new EventTarget()
  et.dispatchEvent()
} catch {
  window.EventTarget = EventTargetPolyfill
}
