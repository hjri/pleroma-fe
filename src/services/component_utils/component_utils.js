import { isFunction } from 'lodash'

const getComponentOptions = (Component) =>
  isFunction(Component) ? Component.options : Component

const getComponentProps = (Component) => getComponentOptions(Component).props

export { getComponentOptions, getComponentProps }
