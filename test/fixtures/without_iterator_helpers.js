// Iterator helpers (Iterator.prototype.forEach, .map, .reduce...) only
// exist in Firefox 131+, Chrome 122+ and Safari 18.4+. Hide them to
// check that code still runs on the browsers we support.
const HELPERS = [
  'drop',
  'every',
  'filter',
  'find',
  'flatMap',
  'forEach',
  'map',
  'reduce',
  'some',
  'take',
  'toArray',
]

export const hideIteratorHelpers = () => {
  const proto = Iterator.prototype
  const saved = HELPERS.map((name) => [
    name,
    Object.getOwnPropertyDescriptor(proto, name),
  ]).filter(([, descriptor]) => descriptor)
  saved.forEach(([name]) => delete proto[name])

  return () =>
    saved.forEach(([name, descriptor]) =>
      Object.defineProperty(proto, name, descriptor),
    )
}
