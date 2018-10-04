import {isBoolean, isString, isArray, isPlainObject} from "./util/types"

export type HTMLAttrs = {[name: string]: any}
export type HTMLChild = string | HTMLElement | (string | HTMLElement)[]

const _createElement = <T extends keyof HTMLElementTagNameMap>(tag: T) =>
    (attrs: HTMLAttrs = {}, ...children: HTMLChild[]): HTMLElementTagNameMap[T] => {
  const element = document.createElement(tag)

  for (const attr in attrs) {
    const value = attrs[attr]

    if (value == null || isBoolean(value) && !value)
      continue

    if (attr === "class" && isArray(value)) {
      for (const cls of (value as string[])) {
        if (cls != null) element.classList.add(cls)
      }
      continue
    }

    if (attr === "style" && isPlainObject(value)) {
      for (const prop in value) {
        (element.style as any)[prop] = value[prop]
      }
      continue
    }

    if (attr === "data" && isPlainObject(value)) {
      for (const key in value) {
        element.dataset[key] = value[key] as string | undefined // XXX: attrs needs a better type
      }
      continue
    }

    element.setAttribute(attr, value)
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

export function createElement<T extends keyof HTMLElementTagNameMap>(tag: T,
     attrs: HTMLAttrs, ...children: HTMLChild[]): HTMLElementTagNameMap[T] {
  return _createElement(tag)(attrs, ...children)
}

export const
  div      = _createElement("div"),
  span     = _createElement("span"),
  link     = _createElement("link"),
  style    = _createElement("style"),
  a        = _createElement("a"),
  p        = _createElement("p"),
  i        = _createElement("i"),
  pre      = _createElement("pre"),
  button   = _createElement("button"),
  label    = _createElement("label"),
  input    = _createElement("input"),
  select   = _createElement("select"),
  option   = _createElement("option"),
  optgroup = _createElement("optgroup"),
  textarea = _createElement("textarea"),
  canvas   = _createElement("canvas"),
  ul       = _createElement("ul"),
  ol       = _createElement("ol"),
  li       = _createElement("li");

export const nbsp = document.createTextNode("\u00a0")

export function removeElement(element: HTMLElement): void {
  const parent = element.parentNode
  if (parent != null) {
    parent.removeChild(element)
  }
}

export function replaceWith(element: HTMLElement, replacement: HTMLElement): void {
  const parent = element.parentNode
  if (parent != null) {
    parent.replaceChild(replacement, element)
  }
}


export function prepend(element: HTMLElement, ...nodes: Node[]): void {
  const first = element.firstChild
  for (const node of nodes) {
    element.insertBefore(node, first)
  }
}

export function empty(element: HTMLElement): void {
  let child
  while (child = element.firstChild) {
    element.removeChild(child)
  }
}

export function show(element: HTMLElement): void {
  element.style.display = ""
}

export function hide(element: HTMLElement): void {
  element.style.display = "none"
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
    top:  rect.top  + window.pageYOffset - document.documentElement.clientTop,
    left: rect.left + window.pageXOffset - document.documentElement.clientLeft,
  }
}

export function matches(el: HTMLElement, selector: string): boolean {
  const p: any = Element.prototype
  const f = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector
  return f.call(el, selector)
}

export function parent(el: HTMLElement, selector: string): HTMLElement | null {
  let node: HTMLElement | null = el

  while (node = node.parentElement) {
    if (matches(node, selector))
      return node
  }

  return null
}

export type Sizing = {top: number, bottom: number, left: number, right: number}

export function margin(el: HTMLElement): Sizing {
  const style = getComputedStyle(el)
  return {
    top:    parseFloat(style.marginTop!)    || 0,
    bottom: parseFloat(style.marginBottom!) || 0,
    left:   parseFloat(style.marginLeft!)   || 0,
    right:  parseFloat(style.marginRight!)  || 0,
  }
}

export function padding(el: HTMLElement): Sizing {
  const style = getComputedStyle(el)
  return {
    top:    parseFloat(style.paddingTop!)    || 0,
    bottom: parseFloat(style.paddingBottom!) || 0,
    left:   parseFloat(style.paddingLeft!)   || 0,
    right:  parseFloat(style.paddingRight!)  || 0,
  }
}

export enum Keys {
  Backspace = 8,
  Tab       = 9,
  Enter     = 13,
  Esc       = 27,
  PageUp    = 33,
  PageDown  = 34,
  Left      = 37,
  Up        = 38,
  Right     = 39,
  Down      = 40,
  Delete    = 46,
}
