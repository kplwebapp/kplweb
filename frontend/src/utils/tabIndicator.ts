/**
 * Site-wide sliding underline for Bootstrap tabs (.nav-tabs). The bar itself is the nav's ::after
 * (styles in index.css); this keeps its position/width variables on the active tab, so switching
 * tabs, resizing or changing font size slides it instead of jumping.
 */
const NAV_SELECTOR = '.nav-tabs'
const READY = 'tab-indicator-ready'

const observed = new WeakSet<Element>()
let frame = 0

function place(nav: HTMLElement) {
  const active = nav.querySelector<HTMLElement>('.nav-link.active')
  if (!active) {
    nav.style.setProperty('--tab-indicator-width', '0px')
    return
  }
  const navBox = nav.getBoundingClientRect()
  const tabBox = active.getBoundingClientRect()
  nav.style.setProperty('--tab-indicator-left', `${tabBox.left - navBox.left + nav.scrollLeft}px`)
  nav.style.setProperty('--tab-indicator-top', `${tabBox.bottom - navBox.top}px`)
  nav.style.setProperty('--tab-indicator-width', `${tabBox.width}px`)
  // Enable the transition only after the first placement, so the bar doesn't slide in from the left on load.
  if (!nav.classList.contains(READY)) requestAnimationFrame(() => nav.classList.add(READY))
}

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const nav = entry.target.closest<HTMLElement>(NAV_SELECTOR)
    if (nav) place(nav)
  }
})

function updateAll() {
  frame = 0
  document.querySelectorAll<HTMLElement>(NAV_SELECTOR).forEach((nav) => {
    if (!observed.has(nav)) {
      observed.add(nav)
      resizeObserver.observe(nav)
    }
    nav.querySelectorAll('.nav-link').forEach((link) => {
      if (!observed.has(link)) {
        observed.add(link)
        resizeObserver.observe(link)
      }
    })
    place(nav)
  })
}

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(updateAll)
}

export function installTabIndicator() {
  new MutationObserver(schedule).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class'],
  })
  window.addEventListener('resize', schedule)
  schedule()
}
