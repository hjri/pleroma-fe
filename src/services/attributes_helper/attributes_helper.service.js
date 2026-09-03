import { kebabCase } from 'lodash-es'

const propsToNative = (props) =>
  Object.keys(props).reduce((acc, cur) => {
    acc[kebabCase(cur)] = props[cur]
    return acc
  }, {})

export { propsToNative }
