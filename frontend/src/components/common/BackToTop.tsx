import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUp } from '@fortawesome/free-solid-svg-icons'
import './BackToTop.scss'

/** Show after scrolling roughly past a page heading. */
const DEFAULT_THRESHOLD = 120

type Props = {
  /** CSS selector for a scroll container; defaults to the window. */
  scrollSelector?: string
  threshold?: number
}

function getScrollTop(target: Window | Element) {
  return target instanceof Window ? target.scrollY : target.scrollTop
}

function scrollToTop(target: Window | Element) {
  if (typeof target.scrollTo === 'function') {
    target.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  ;(target as Element).scrollTop = 0
}

/** Fixed bottom-right control; visible only after the user scrolls past `threshold`. */
export default function BackToTop({ scrollSelector, threshold = DEFAULT_THRESHOLD }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target: Window | Element =
      (scrollSelector ? document.querySelector(scrollSelector) : null) ?? window

    const onScroll = () => setVisible(getScrollTop(target) > threshold)
    onScroll()
    target.addEventListener('scroll', onScroll, { passive: true })
    return () => target.removeEventListener('scroll', onScroll)
  }, [scrollSelector, threshold])

  const handleClick = () => {
    const target: Window | Element =
      (scrollSelector ? document.querySelector(scrollSelector) : null) ?? window
    scrollToTop(target)
  }

  return (
    <button
      type="button"
      className={`back-to-top${visible ? ' back-to-top--visible' : ''}`}
      onClick={handleClick}
      aria-label="Back to top"
      title="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <FontAwesomeIcon icon={faArrowUp} />
    </button>
  )
}
