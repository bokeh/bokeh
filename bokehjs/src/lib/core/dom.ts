import {isBoolean, isNumber, isString, isArray, isPlainObject} from "./util/types"
import {entries} from "./util/object"
import {BBox} from "./util/bbox"
import type {Size, Box, Extents} from "./types"
import type {CSSStyles, CSSStyleSheetDecl} from "./css"
import {compose_stylesheet} from "./css"

export type {CSSStyles, CSSStylesNative, CSSOurStyles} from "./css"

export type HTMLAttrs = {[name: string]: unknown}
export type HTMLItem = string | Node | NodeList | HTMLCollection | null | undefined
export type HTMLChild = HTMLItem | HTMLItem[]

const _createElement = <T extends keyof HTMLElementTagNameMap>(tag: T) => {
  return (attrs: HTMLAttrs | HTMLChild = {}, ...children: HTMLChild[]): HTMLElementTagNameMap[T] => {
    const element = document.createElement(tag)

    if (!isPlainObject(attrs)) {
      children = [attrs, ...children]
      attrs = {}
    }

    for (let [attr, value] of entries(attrs)) {
      if (value == null || isBoolean(value) && !value)
        continue

      if (attr === "class") {
        if (isString(value))
          value = value.split(/\s+/)

        if (isArray(value)) {
          for (const cls of value as (string | null | undefined)[]) {
            if (cls != null)
              element.classList.add(cls)
          }
          continue
        }
      }

      if (attr === "style" && isPlainObject(value)) {
        for (const [prop, data] of entries(value)) {
          (element.style as any)[prop] = data
        }
        continue
      }

      if (attr === "data" && isPlainObject(value)) {
        for (const [key, data] of entries(value)) {
          element.dataset[key] = data as string | undefined // XXX: attrs needs a better type
        }
        continue
      }

      element.setAttribute(attr, value as string)
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
    tag: T, attrs: HTMLAttrs | null, ...children: HTMLChild[]): HTMLElementTagNameMap[T] {
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
  legend   = _createElement("legend"),
  fieldset = _createElement("fieldset"),
  input    = _createElement("input"),
  select   = _createElement("select"),
  option   = _createElement("option"),
  optgroup = _createElement("optgroup"),
  textarea = _createElement("textarea")

export type SVGAttrs = {[key: string]: string | false | null | undefined}

export function createSVGElement<T extends keyof SVGElementTagNameMap>(
    tag: T, attrs: SVGAttrs | null = null, ...children: HTMLChild[]): SVGElementTagNameMap[T] {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag)

  for (const [attr, value] of entries(attrs ?? {})) {
    if (value == null || value === false)
      continue
    element.setAttribute(attr, value)
  }

  function append(child: HTMLItem): void {
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

export function text(str: string): Text {
  return document.createTextNode(str)
}

export function nbsp(): Text {
  return text("\u00a0")
}

export function append(element: Node, ...children: Node[]): void {
  for (const child of children)
    element.appendChild(child)
}

export function remove(element: Node): void {
  const parent = element.parentNode
  if (parent != null) {
    parent.removeChild(element)
  }
}

export function replaceWith(element: Node, replacement: Node): void {
  const parent = element.parentNode
  if (parent != null) {
    parent.replaceChild(replacement, element)
  }
}

export function prepend(element: Node, ...nodes: Node[]): void {
  const first = element.firstChild
  for (const node of nodes) {
    element.insertBefore(node, first)
  }
}

export function empty(node: Node, attrs: boolean = false): void {
  let child: ChildNode | null
  while ((child = node.firstChild) != null) {
    node.removeChild(child)
  }
  if (attrs && node instanceof Element) {
    for (const attr of node.attributes) {
      node.removeAttributeNode(attr)
    }
  }
}

export function contains(element: Element, child: Node) {
  /**
   * Like Node.contains(), but traverses Shadow DOM boundaries.
   */
  let current = child

  while (current.parentNode != null) {
    const parent = current.parentNode
    if (parent == element) {
      return true
    } else if (parent instanceof ShadowRoot) {
      current = parent.host
    } else {
      current = parent
    }
  }

  return false
}

export function display(element: HTMLElement, display: boolean = true): void {
  element.style.display = display ? "" : "none"
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

export function offset_bbox(element: Element): BBox {
  const {top, left, width, height} = element.getBoundingClientRect()
  return new BBox({
    left: left + scrollX - document.documentElement.clientLeft,
    top:  top  + scrollY - document.documentElement.clientTop,
    width,
    height,
  })
}

export function parent(el: HTMLElement, selector: string): HTMLElement | null {
  let node: HTMLElement | null = el

  while ((node = node.parentElement) != null) {
    if (node.matches(selector))
      return node
  }

  return null
}

function num(value: string | null): number {
  const num = parseFloat(value!)
  return isFinite(num) ? num : 0
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
  for (const child of (el.shadowRoot ?? el).children) {
    const rect = child.getBoundingClientRect()
    width = Math.max(width, Math.ceil(rect.left - left - padding.left + rect.width))
    height = Math.max(height, Math.ceil(rect.top - top - padding.top + rect.height))
  }
  return {width, height}
}

export function bounding_box(el: Element): BBox {
  const {x, y, width, height} = el.getBoundingClientRect()
  return new BBox({x, y, width, height})
}

export function box_size(el: Element): Size {
  const {width, height} = el.getBoundingClientRect()
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

export class ClassList {
  constructor(private readonly class_list: DOMTokenList) {}

  get values(): string[] {
    const values = []
    for (let i = 0; i < this.class_list.length; i++) {
      const item = this.class_list.item(i)
      if (item != null)
        values.push(item)
    }
    return values
  }

  has(cls: string): boolean {
    return this.class_list.contains(cls)
  }

  add(...classes: string[]): this {
    for (const cls of classes)
      this.class_list.add(cls)
    return this
  }

  remove(...classes: string[] | string[][]): this {
    for (const cls of classes) {
      if (isArray(cls)) {
        cls.forEach((cls) => this.class_list.remove(cls))
      } else {
        this.class_list.remove(cls)
      }
    }
    return this
  }

  clear(): this {
    for (const cls of this.values) {
      this.class_list.remove(cls)
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
  return new ClassList(el.classList)
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

type WhitespaceKeys = "Tab" | "Enter" | " "
type UIKeys = "Escape"
type NavigationKeys = "Home" | "End" | "PageUp" | "PageDown" | "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"
type EditingKeys = "Backspace" | "Delete"

export type Keys = WhitespaceKeys | UIKeys | NavigationKeys | EditingKeys

export enum MouseButton {
  None = 0b0,
  Primary = 0b1,
  Secondary = 0b10,
  Auxiliary = 0b100,
  Left = Primary,
  Right = Secondary,
  Middle = Auxiliary,
}

export abstract class StyleSheet {
  protected readonly el: HTMLStyleElement | HTMLLinkElement

  install(el: HTMLElement | ShadowRoot): void {
    el.append(this.el)
  }

  uninstall(): void {
    this.el.remove()
  }
}

export class InlineStyleSheet extends StyleSheet {
  protected override readonly el = style({type: "text/css"})

  constructor(css?: string | CSSStyleSheetDecl) {
    super()
    if (isString(css)) {
      this._update(css)
    } else if (css != null) {
      this._update(compose_stylesheet(css))
    }
  }

  get css(): string {
    return this.el.textContent ?? ""
  }

  protected _update(css: string): void {
    this.el.textContent = css
  }

  clear(): void {
    this.replace("")
  }

  private _to_css(css: string, styles: CSSStyles | undefined): string {
    if (styles == null) {
      return css
    } else {
      return compose_stylesheet({[css]: styles})
    }
  }

  replace(css: string, styles?: CSSStyles): void {
    this._update(this._to_css(css, styles))
  }

  prepend(css: string, styles?: CSSStyles): void {
    this._update(`${this._to_css(css, styles)}\n${this.css}`)
  }

  append(css: string, styles?: CSSStyles): void {
    this._update(`${this.css}\n${this._to_css(css, styles)}`)
  }

  remove(): void {
    remove(this.el)
  }
}

export class GlobalInlineStyleSheet extends InlineStyleSheet {
  override install(): void {
    if (!this.el.isConnected) {
      document.head.appendChild(this.el)
    }
  }
}

export class ImportedStyleSheet extends StyleSheet {
  protected override readonly el: HTMLLinkElement

  constructor(url: string) {
    super()
    this.el = link({rel: "stylesheet", href: url})
  }

  replace(url: string): void {
    this.el.href = url
  }

  remove(): void {
    remove(this.el)
  }
}

export class GlobalImportedStyleSheet extends ImportedStyleSheet {
  override install(): void {
    if (!this.el.isConnected) {
      document.head.appendChild(this.el)
    }
  }
}

export type StyleSheetLike = StyleSheet | string

export async function dom_ready(): Promise<void> {
  if (document.readyState == "loading") {
    return new Promise((resolve, _reject) => {
      document.addEventListener("DOMContentLoaded", () => resolve(), {once: true})
    })
  }
}

export function px(value: number | string): string {
  return isNumber(value) ? `${value}px` : value
}

export const supports_adopted_stylesheets = "adoptedStyleSheets" in ShadowRoot.prototype
