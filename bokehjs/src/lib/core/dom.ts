import {isBoolean, isString, isArray, isPlainObject} from "./util/types"
import {Size, Box, Extents} from "./types"

export type HTMLAttrs = {[name: string]: any}
export type HTMLItem = string | Node | NodeList | HTMLCollection | null | undefined
export type HTMLChild = HTMLItem | HTMLItem[]

const _createElement = <T extends keyof HTMLElementTagNameMap>(tag: T) => {
  return (attrs: HTMLAttrs = {}, ...children: HTMLChild[]): HTMLElementTagNameMap[T] => {
    const element = document.createElement(tag)
    element.classList.add("bk")

    for (const attr in attrs) {
      let value = attrs[attr]

      if (value == null || isBoolean(value) && !value)
        continue

      if (attr === "class") {
        if (isString(value))
          value = value.split(/\s+/)

        if (isArray(value)) {
          for (const cls of (value as string[])) {
            if (cls != null)
              element.classList.add(cls)
          }
          continue
        }
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

    function append(child: HTMLItem) {
      if (isString(child))
        element.appendChild(document.createTextNode(child))
      else if (child instanceof Node)
        element.appendChild(child)
      else if (child instanceof NodeList || child instanceof HTMLCollection) {
        for (const el of child) {
          element.appendChild(el)
        }
      } else if (child != null && child !== false)
        throw new Error(`expected a DOM element, string, false or null, got ${JSON.stringify(child)}`)
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
}

export function createElement<T extends keyof HTMLElementTagNameMap>(
    tag: T, attrs: HTMLAttrs, ...children: HTMLChild[]): HTMLElementTagNameMap[T] {
  return _createElement(tag)(attrs, ...children)
}

export const
  div      = _createElement("div"),
  span     = _createElement("span"),
  canvas   = _createElement("canvas"),
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
  textarea = _createElement("textarea")

export function nbsp(): Text {
  return document.createTextNode("\u00a0")
}

export function append(element: HTMLElement, ...children: Element[]): void {
  for (const child of children)
    element.appendChild(child)
}

export function remove(element: HTMLElement): void {
  const parent = element.parentNode
  if (parent != null) {
    parent.removeChild(element)
  }
}

export const removeElement = remove

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

export function empty(element: HTMLElement, attrs: boolean = false): void {
  let child: ChildNode | null
  while (child = element.firstChild) {
    element.removeChild(child)
  }
  if (attrs) {
    for (const attr of element.attributes) {
      element.removeAttributeNode(attr)
    }
  }
}

export function display(element: HTMLElement): void {
  element.style.display = ""
}

export function undisplay(element: HTMLElement): void {
  element.style.display = "none"
}

export function show(element: HTMLElement): void {
  element.style.visibility = ""
}

export function hide(element: HTMLElement): void {
  element.style.visibility = "hidden"
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

function num(value: string | null): number {
  return parseFloat(value!) || 0
}

export type ElementExtents = {
  border: Extents
  margin: Extents
  padding: Extents
}

export function extents(el: HTMLElement): ElementExtents  {
  const style = getComputedStyle(el)
  return {
    border: {
      top:    num(style.borderTopWidth),
      bottom: num(style.borderBottomWidth),
      left:   num(style.borderLeftWidth),
      right:  num(style.borderRightWidth),
    },
    margin: {
      top:    num(style.marginTop),
      bottom: num(style.marginBottom),
      left:   num(style.marginLeft),
      right:  num(style.marginRight),
    },
    padding: {
      top:    num(style.paddingTop),
      bottom: num(style.paddingBottom),
      left:   num(style.paddingLeft),
      right:  num(style.paddingRight),
    },
  }
}

export function size(el: HTMLElement): Size {
  const rect = el.getBoundingClientRect()
  return {
    width: Math.ceil(rect.width),
    height: Math.ceil(rect.height),
  }
}

export function scroll_size(el: HTMLElement): Size {
  return {
    width: Math.ceil(el.scrollWidth),
    height: Math.ceil(el.scrollHeight),
  }
}

export function outer_size(el: HTMLElement): Size {
  const {margin: {left, right, top, bottom}} = extents(el)
  const {width, height} = size(el)
  return {
    width: Math.ceil(width + left + right),
    height: Math.ceil(height + top + bottom),
  }
}

export function content_size(el: HTMLElement): Size {
  const {left, top} = el.getBoundingClientRect()
  const {padding} = extents(el)
  let width = 0
  let height = 0
  for (const child of el.children) {
    const rect = child.getBoundingClientRect()
    width = Math.max(width, Math.ceil(rect.left - left - padding.left + rect.width))
    height = Math.max(height, Math.ceil(rect.top - top - padding.top + rect.height))
  }
  return {width, height}
}

export function position(el: HTMLElement, box: Box, margin?: Extents): void {
  const {style} = el

  style.left   = `${box.x}px`
  style.top    = `${box.y}px`
  style.width  = `${box.width}px`
  style.height = `${box.height}px`

  if (margin == null)
    style.margin = ""
  else {
    const {top, right, bottom, left} = margin
    style.margin = `${top}px ${right}px ${bottom}px ${left}px`
  }
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
    for (const cls of this.values) {
      if (cls != "bk")
        this.classList.remove(cls)
    }
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

export function toggle_attribute(el: HTMLElement, attr: string, state?: boolean): void {
  if (state == null) {
    state = !el.hasAttribute(attr)
  }

  if (state)
    el.setAttribute(attr, "true")
  else
    el.removeAttribute(attr)
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
  const {width, height, position, display} = el.style
  el.style.position = "absolute"
  el.style.display = ""
  el.style.width = size.width != null && size.width != Infinity ? `${size.width}px` : "auto"
  el.style.height = size.height != null && size.height != Infinity ? `${size.height}px` : "auto"
  try {
    return fn()
  } finally {
    el.style.position = position
    el.style.display = display
    el.style.width = width
    el.style.height = height
  }
}

export class StyleSheet {
  private readonly style: HTMLStyleElement
  private readonly known: Set<string> = new Set()

  constructor(readonly root: HTMLElement) {
    this.style = style({type: "text/css"})
    prepend(root, this.style)
  }

  append(css: string): void {
    if (!this.known.has(css)) {
      this.style.appendChild(document.createTextNode(css))
      this.known.add(css)
    }
  }
}

export const stylesheet = new StyleSheet(document.head)
