/*!
 * jQuery Mousewheel 3.1.13
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 */

function getLineHeight(element: HTMLElement) {
    const parent = element.offsetParent || document.body

    return parseInt(getComputedStyle(parent).fontSize, 10)  ||
           parseInt(getComputedStyle(element).fontSize, 10) || 16
}

function getPageHeight(element: HTMLElement) {
  return element.clientHeight // XXX: should be content height?
}

export function getDeltaY(event: WheelEvent) {
  var deltaY = -event.deltaY

  switch (event.deltaMode) {
    case event.DOM_DELTA_LINE:
      var lineHeight = getLineHeight(event.target)
      deltaY *= lineHeight
      break
    case event.DOM_DELTA_PAGE:
      var pageHeight = getPageHeight(event.target)
      deltaY *= pageHeight
      break
  }

  return deltaY
}
