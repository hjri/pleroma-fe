// Captures a scroll position
export const getScrollPosition = () => {
  return {
    scrollTop: window.scrollY,
    scrollHeight: document.documentElement.scrollHeight,
    offsetHeight: window.innerHeight,
  }
}

// A helper function that is used to keep the scroll position fixed as the new elements are added to the top
// Takes two scroll positions, before and after the update.
export const getNewTopPosition = (previousPosition, newPosition) => {
  return (
    previousPosition.scrollTop +
    (newPosition.scrollHeight - previousPosition.scrollHeight)
  )
}

// Returns whether or not the scrollbar is visible.
export const isScrollable = () => {
  return document.documentElement.scrollHeight > window.innerHeight
}
