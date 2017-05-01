/*!
 * jQuery Mousewheel 3.1.13
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 */

function fontSize(element: Element): number | null {
  const value = getComputedStyle(element).fontSize
  if (value != null)
    return parseInt(value, 10)
  return null
}

function lineHeight(element: HTMLElement): number {
  const parent = element.offsetParent || document.body
  return fontSize(parent) || fontSize(element) || 16
}

function pageHeight(element: HTMLElement): number {
  return element.clientHeight // XXX: should be content height?
}

export function getDeltaY(event: WheelEvent) {
  let deltaY = -event.deltaY

  if (event.target instanceof HTMLElement) {
    switch (event.deltaMode) {
      case event.DOM_DELTA_LINE:
        deltaY *= lineHeight(event.target)
        break
      case event.DOM_DELTA_PAGE:
        deltaY *= pageHeight(event.target)
        break
    }
  }

  return deltaY
}
