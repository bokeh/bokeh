import {isBoolean, isString, isArray, isPlainObject} from "./util/types"
import {BBox} from "./util/bbox"

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
  li       = _createElement("li")

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

export function offset(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return {
    top:  rect.top  + window.pageYOffset - document.documentElement!.clientTop,
    left: rect.left + window.pageXOffset - document.documentElement!.clientLeft,
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

function num(value: string | null): number {
  return parseFloat(value!) || 0
}

export function border(el: HTMLElement): Sizing {
  const style = getComputedStyle(el)
  return {
    top:    num(style.borderTopWidth),
    bottom: num(style.borderBottomWidth),
    left:   num(style.borderLeftWidth),
    right:  num(style.borderRightWidth),
  }
}

export function margin(el: HTMLElement): Sizing {
  const style = getComputedStyle(el)
  return {
    top:    num(style.marginTop),
    bottom: num(style.marginBottom),
    left:   num(style.marginLeft),
    right:  num(style.marginRight),
  }
}

export function padding(el: HTMLElement): Sizing {
  const style = getComputedStyle(el)
  return {
    top:    num(style.paddingTop),
    bottom: num(style.paddingBottom),
    left:   num(style.paddingLeft),
    right:  num(style.paddingRight),
  }
}

export type Size = {width: number, height: number}

export function size(el: HTMLElement): Size {
  const rect = el.getBoundingClientRect()
  return {
    width: Math.ceil(rect.width),
    height: Math.ceil(rect.height),
  }
}

export function outer_size(el: HTMLElement): Size {
  const {left, right, top, bottom} = margin(el)
  const {width, height} = size(el)
  return {
    width: Math.ceil(width + left + right),
    height: Math.ceil(height + top + bottom),
  }
}

export function position(el: HTMLElement, bbox: BBox): void {
  const {style} = el
  style.left     = `${bbox.left}px`
  style.top      = `${bbox.top}px`
  style.width    = `${bbox.width}px`
  style.height   = `${bbox.height}px`
}

export function children(el: HTMLElement): HTMLElement[] {
  return Array.from(el.children) as HTMLElement[]
}

export class ClassList {

  private readonly classList: DOMTokenList

  constructor(readonly el: HTMLElement) {
    this.classList = el.classList
  }

  get values(): string[] {
    const values = []
    for (let i = 0; i < this.classList.length; i++) {
      const item = this.classList.item(i)
      if (item != null)
        values.push(item)
    }
    return values
  }

  has(cls: string): boolean {
    return this.classList.contains(cls)
  }

  add(...classes: string[]): this {
    for (const cls of classes)
      this.classList.add(cls)
    return this
  }

  remove(...classes: string[]): this {
    for (const cls of classes)
      this.classList.remove(cls)
    return this
  }

  clear(): this {
    this.el.className = ""
    return this
  }

  toggle(cls: string, activate?: boolean): this {
    const add = activate != null ? activate : !this.has(cls)
    if (add)
      this.add(cls)
    else
      this.remove(cls)
    return this
  }
}

export function classes(el: HTMLElement): ClassList {
  return new ClassList(el)
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

export function undisplayed<T>(el: HTMLElement, fn: () => T): T {
  const {display} = el.style
  el.style.display = "none"
  try {
    return fn()
  } finally {
    el.style.display = display
  }
}

export function unsized<T>(el: HTMLElement, fn: () => T): T {
  return sized(el, {}, fn)
}

export function sized<T>(el: HTMLElement, size: Partial<Size>, fn: () => T): T {
  const {width, height, position} = el.style
  el.style.position = "absolute"
  el.style.width = size.width != null ? `${size.width}px` : ""
  el.style.height = size.height != null ? `${size.height}px` : ""
  try {
    return fn()
  } finally {
    el.style.position = position
    el.style.width = width
    el.style.height = height
  }
}
