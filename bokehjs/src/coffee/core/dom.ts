import {isBoolean, isString, isArray, isObject} from "./util/types"

export type HTMLAttrs = { [name: string]: any }
export type HTMLChildren = Array<string | HTMLElement | Array<string | HTMLElement>>

const _createElement = (tag: string) => (attrs: HTMLAttrs = {}, ...children: HTMLChildren): HTMLElement => {
  let element
  if (tag === "fragment") {
    element = document.createDocumentFragment()
  } else {
    element = document.createElement(tag)
    for (const attr in attrs) {
      const value = attrs[attr]

      if (value == null || isBoolean(value) && !value)
        continue

      if (attr === "class" && isArray(value)) {
        for (const cls of value) {
          if (cls != null) element.classList.add(cls)
        }
        continue
      }

      if (attr === "style" && isObject(value)) {
        for (const prop in value) {
          element.style[prop] = value[prop]
        }
        continue
      }

      element.setAttribute(attr, value)
    }
  }

  function append(child: HTMLElement | string) {
    if (child instanceof HTMLElement)
      element.appendChild(child)
    else if (isString(child))
      element.appendChild(document.createTextNode(child))
    else if (child != null && child !== false)
      throw new Error(`expected an HTMLElement, string, false or null, got ${JSON.stringify(child)}`)
  }

  for (const child of children) {
    if (isArray(child)) {
      for (const _child of child)
        append(_child)
    } else
      append(child)
  }

  return element
}

export function createElement(tag: string, attrs: HTMLAttrs, ...children: HTMLChildren): HTMLElement {
  return _createElement(tag)(attrs, ...children)
}

export const
  div    = _createElement("div"),
  span   = _createElement("span"),
  link   = _createElement("link"),
  style  = _createElement("style"),
  a      = _createElement("a"),
  p      = _createElement("p"),
  pre    = _createElement("pre"),
  input  = _createElement("input"),
  label  = _createElement("label"),
  canvas = _createElement("canvas"),
  ul     = _createElement("ul"),
  ol     = _createElement("ol"),
  li     = _createElement("li");

export function show(element: HTMLElement): void {
  element.style.display = ""
}

export function hide(element: HTMLElement): void {
  element.style.display = "none"
}

export function empty(element: HTMLElement): void {
  let child
  while (child = element.firstChild) {
    element.removeChild(child)
  }
}

export function position(element: HTMLElement) {
  return {
    top: element.offsetTop,
    left: element.offsetLeft,
  }
}

export function offset(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return {
    top:  rect.top  + document.body.scrollTop,
    left: rect.left + document.body.scrollLeft,
  }
}

export function replaceWith(element: HTMLElement, replacement: HTMLElement) {
  const parent = element.parentNode
  if (parent != null) {
    parent.replaceChild(replacement, element)
  }
}
