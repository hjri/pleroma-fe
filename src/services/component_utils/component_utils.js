import { isFunction } from 'lodash-es'

const getComponentOptions = (Component) =>
  isFunction(Component) ? Component.options : Component

const getComponentProps = (Component) => getComponentOptions(Component).props

export { getComponentOptions, getComponentProps }
