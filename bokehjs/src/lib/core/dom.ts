import {isBoolean, isNumber, isString, isArray, isPlainObject} from "./util/types"
import {entries} from "./util/object"
import {BBox} from "./util/bbox"
import type {Size, Box, Extents, PlainObject} from "./types"
import type {CSSStyles, CSSStyleSheetDecl} from "./css"
import {compose_stylesheet, apply_styles} from "./css"
import {logger} from "./logging"

export type Optional<T> = {[P in keyof T]?: T[P] | null | undefined}

export type HTMLElementName = keyof HTMLElementTagNameMap

export type CSSClass = string

export type ElementOurAttrs = {
  class?: CSSClass | (CSSClass | null | undefined)[]
  style?: CSSStyles | string
  data?: PlainObject<string | null | undefined>
}

export type ElementCommonAttrs = {
  id: Element["id"]
  title: HTMLElement["title"]
  tabIndex: HTMLOrSVGElement["tabIndex"]
}

export type HTMLAttrs<_T extends HTMLElementName, ElementSpecificAttrs> = ElementOurAttrs & Optional<ElementCommonAttrs> & Optional<ElementSpecificAttrs>

export type HTMLItem = string | Node | NodeList | HTMLCollection | null | undefined
export type HTMLChild = HTMLItem | HTMLItem[]

const _element = <T extends keyof HTMLElementTagNameMap, ElementSpecificAttrs>(tag: T) => {
  return (attrs: HTMLAttrs<T, ElementSpecificAttrs> | HTMLChild = {}, ...children: HTMLChild[]): HTMLElementTagNameMap[T] => {
    const element = document.createElement(tag)

    if (!isPlainObject(attrs)) {
      children = [attrs, ...children]
      attrs = {}
    } else {
      attrs = {...attrs}
    }

    if (attrs.class != null) {
      const classes = (() => {
        if (isString(attrs.class)) {
          return attrs.class.split(/\s+/)
        } else {
          return attrs.class
        }
      })()

      for (const cls of classes) {
        if (cls != null) {
          element.classList.add(cls)
        }
      }

      delete attrs.class
    }

    if (attrs.style != null) {
      if (isString(attrs.style)) {
        element.setAttribute("style", attrs.style)
      } else {
        apply_styles(element.style, attrs.style)
      }
      delete attrs.style
    }

    if (attrs.data != null) {
      for (const [key, data] of entries(attrs.data)) {
        if (data != null) {
          element.dataset[key] = data
        }
      }
      delete attrs.data
    }

    for (const [attr, value] of entries<unknown>(attrs)) {
      if (value == null) {
        continue
      } else if (isBoolean(value)) {
        element.toggleAttribute(attr, value)
      } else if (isNumber(value)) {
        element.setAttribute(attr, `${value}`)
      } else if (isString(value)) {
        element.setAttribute(attr, value)
      } else {
        logger.warn(`unable to set attribute: ${attr} = ${value}`)
      }
    }

    function append(child: HTMLItem) {
      if (isString(child)) {
        element.append(document.createTextNode(child))
      } else if (child instanceof Node) {
        element.append(child)
      } else if (child instanceof NodeList || child instanceof HTMLCollection) {
        element.append(...child)
      } else if (child != null && child !== false) {
        throw new Error(`expected a DOM element, string, false or null, got ${JSON.stringify(child)}`)
      }
    }

    for (const child of children) {
      if (isArray(child)) {
        for (const _child of child) {
          append(_child)
        }
      } else {
        append(child)
      }
    }

    return element
  }
}

export function create_element<T extends keyof HTMLElementTagNameMap>(
    tag: T, attrs: HTMLAttrs<T, {}> | null, ...children: HTMLChild[]): HTMLElementTagNameMap[T] {
  return _element(tag)(attrs, ...children)
}

export type AAttrs = {
  href: HTMLAnchorElement["href"]
  target: HTMLAnchorElement["target"]
}
export type AbbrAttrs = {}
export type AddressAttrs = {}
export type AreaAttrs = {}
export type ArticleAttrs = {}
export type AsideAttrs = {}
export type AudioAttrs = {}
export type BAttrs = {}
export type BaseAttrs = {}
export type BdiAttrs = {}
export type BdoAttrs = {}
export type BlockQuoteAttrs = {}
export type BodyAttrs = {}
export type BrAttrs = {}
export type ButtonAttrs = {
  type: "button"
  disabled: HTMLButtonElement["disabled"]
}
export type CanvasAttrs = {
  width: HTMLCanvasElement["width"]
  height: HTMLCanvasElement["height"]
}
export type CaptionAttrs = {}
export type CiteAttrs = {}
export type CodeAttrs = {}
export type ColAttrs = {}
export type ColGroupAttrs = {}
export type DataAttrs = {}
export type DataListAttrs = {}
export type DdAttrs = {}
export type DelAttrs = {}
export type DetailsAttrs = {}
export type DfnAttrs = {}
export type DialogAttrs = {}
export type DivAttrs = {}
export type DlAttrs = {}
export type DtAttrs = {}
export type EmAttrs = {}
export type EmbedAttrs = {}
export type FieldSetAttrs = {}
export type FigCaptionAttrs = {}
export type FigureAttrs = {}
export type FooterAttrs = {}
export type FormAttrs = {}
export type H1Attrs = {}
export type H2Attrs = {}
export type H3Attrs = {}
export type H4Attrs = {}
export type H5Attrs = {}
export type H6Attrs = {}
export type HeadAttrs = {}
export type HeaderAttrs = {}
export type HGroupAttrs = {}
export type HrAttrs = {}
export type HtmlAttrs = {}
export type IAttrs = {}
export type IFrameAttrs = {}
export type ImgAttrs = {}
export type InputAttrs = {
  type: "text" | "checkbox" | "radio" | "file" | "color"
  name:  HTMLInputElement["name"]
  multiple: HTMLInputElement["multiple"]
  disabled: HTMLInputElement["disabled"]
  checked: HTMLInputElement["checked"]
  placeholder: HTMLInputElement["placeholder"]
  accept: HTMLInputElement["accept"]
  value: HTMLInputElement["value"]
  readonly: HTMLInputElement["readOnly"]
  webkitdirectory: HTMLInputElement["webkitdirectory"]
}
export type InsAttrs = {}
export type KbdAttrs = {}
export type LabelAttrs = {
  for: HTMLLabelElement["htmlFor"]
}
export type LegendAttrs = {}
export type LiAttrs = {}
export type LinkAttrs = {
  rel: HTMLLinkElement["rel"]
  href: HTMLLinkElement["href"]
  disabled: HTMLLinkElement["disabled"]
}
export type MainAttrs = {}
export type MapAttrs = {}
export type MarkAttrs = {}
export type MenuAttrs = {}
export type MetaAttrs = {}
export type MeterAttrs = {}
export type NavAttrs = {}
export type NoScriptAttrs = {}
export type ObjectAttrs = {}
export type OlAttrs = {}
export type OptGroupAttrs = {
  disabled: HTMLOptGroupElement["disabled"]
  label: HTMLOptGroupElement["label"]
}
export type OptionAttrs = {
  disabled: HTMLOptionElement["disabled"]
  value: HTMLOptionElement["value"]
}
export type OutputAttrs = {}
export type PAttrs = {}
export type PictureAttrs = {}
export type PreAttrs = {}
export type ProgressAttrs = {}
export type QAttrs = {}
export type RpAttrs = {}
export type RtAttrs = {}
export type RubyAttrs = {}
export type SAttrs = {}
export type SAmpAttrs = {}
export type ScriptAttrs = {}
export type SearchAttrs = {}
export type SectionAttrs = {}
export type SelectAttrs = {
  name:  HTMLSelectElement["name"]
  disabled: HTMLSelectElement["disabled"]
  multiple: HTMLSelectElement["multiple"]
}
export type SlotAttrs = {}
export type SmallAttrs = {}
export type SourceAttrs = {}
export type SpanAttrs = {}
export type StrongAttrs = {}
export type StyleAttrs = {}
export type SubAttrs = {}
export type SummaryAttrs = {}
export type SupAttrs = {}
export type TableAttrs = {}
export type TBodyAttrs = {}
export type TdAttrs = {}
export type TemplateAttrs = {}
export type TextAreaAttrs = {}
export type TFootAttrs = {}
export type ThAttrs = {}
export type THeadAttrs = {}
export type TimeAttrs = {}
export type TitleAttrs = {}
export type TrAttrs = {}
export type TrackAttrs = {}
export type UAttrs = {}
export type UlAttrs = {}
export type VideoAttrs = {}
export type WbrAttrs = {}

export const a = _element<"a", AAttrs>("a")
export const abbr = _element<"abbr", AbbrAttrs>("abbr")
export const address = _element<"address", AddressAttrs>("address")
export const area = _element<"area", AreaAttrs>("area")
export const article = _element<"article", ArticleAttrs>("article")
export const aside = _element<"aside", AsideAttrs>("aside")
export const audio = _element<"audio", AudioAttrs>("audio")
export const b = _element<"b", BAttrs>("b")
export const base = _element<"base", BaseAttrs>("base")
export const bdi = _element<"bdi", BdiAttrs>("bdi")
export const bdo = _element<"bdo", BdoAttrs>("bdo")
export const blockquote = _element<"blockquote", BlockQuoteAttrs>("blockquote")
export const body = _element<"body", BodyAttrs>("body")
export const br = _element<"br", BrAttrs>("br")
export const button = _element<"button", ButtonAttrs>("button")
export const canvas = _element<"canvas", CanvasAttrs>("canvas")
export const caption = _element<"caption", CaptionAttrs>("caption")
export const cite = _element<"cite", CiteAttrs>("cite")
export const code = _element<"code", CodeAttrs>("code")
export const col = _element<"col", ColAttrs>("col")
export const colgroup = _element<"colgroup", ColGroupAttrs>("colgroup")
export const data = _element<"data", DataAttrs>("data")
export const datalist = _element<"datalist", DataListAttrs>("datalist")
export const dd = _element<"dd", DdAttrs>("dd")
export const del = _element<"del", DelAttrs>("del")
export const details = _element<"details", DetailsAttrs>("details")
export const dfn = _element<"dfn", DfnAttrs>("dfn")
export const dialog = _element<"dialog", DialogAttrs>("dialog")
export const div = _element<"div", DivAttrs>("div")
export const dl = _element<"dl", DlAttrs>("dl")
export const dt = _element<"dt", DtAttrs>("dt")
export const em = _element<"em", EmAttrs>("em")
export const embed = _element<"embed", EmbedAttrs>("embed")
export const fieldset = _element<"fieldset", FieldSetAttrs>("fieldset")
export const figcaption = _element<"figcaption", FigCaptionAttrs>("figcaption")
export const figure = _element<"figure", FigureAttrs>("figure")
export const footer = _element<"footer", FooterAttrs>("footer")
export const form = _element<"form", FormAttrs>("form")
export const h1 = _element<"h1", H1Attrs>("h1")
export const h2 = _element<"h2", H2Attrs>("h2")
export const h3 = _element<"h3", H3Attrs>("h3")
export const h4 = _element<"h4", H4Attrs>("h4")
export const h5 = _element<"h5", H5Attrs>("h5")
export const h6 = _element<"h6", H6Attrs>("h6")
export const head = _element<"head", HeadAttrs>("head")
export const header = _element<"header", HeaderAttrs>("header")
export const hgroup = _element<"hgroup", HGroupAttrs>("hgroup")
export const hr = _element<"hr", HrAttrs>("hr")
export const html = _element<"html", HtmlAttrs>("html")
export const i = _element<"i", IAttrs>("i")
export const iframe = _element<"iframe", IFrameAttrs>("iframe")
export const img = _element<"img", ImgAttrs>("img")
export const input = _element<"input", InputAttrs>("input")
export const ins = _element<"ins", InsAttrs>("ins")
export const kbd = _element<"kbd", KbdAttrs>("kbd")
export const label = _element<"label", LabelAttrs>("label")
export const legend = _element<"legend", LegendAttrs>("legend")
export const li = _element<"li", LiAttrs>("li")
export const link = _element<"link", LinkAttrs>("link")
export const main = _element<"main", MainAttrs>("main")
export const map = _element<"map", MapAttrs>("map")
export const mark = _element<"mark", MarkAttrs>("mark")
export const menu = _element<"menu", MenuAttrs>("menu")
export const meta = _element<"meta", MetaAttrs>("meta")
export const meter = _element<"meter", MeterAttrs>("meter")
export const nav = _element<"nav", NavAttrs>("nav")
export const noscript = _element<"noscript", NoScriptAttrs>("noscript")
export const object = _element<"object", ObjectAttrs>("object")
export const ol = _element<"ol", OlAttrs>("ol")
export const optgroup = _element<"optgroup", OptGroupAttrs>("optgroup")
export const option = _element<"option", OptionAttrs>("option")
export const output = _element<"output", OutputAttrs>("output")
export const p = _element<"p", PAttrs>("p")
export const picture = _element<"picture", PictureAttrs>("picture")
export const pre = _element<"pre", PreAttrs>("pre")
export const progress = _element<"progress", ProgressAttrs>("progress")
export const q = _element<"q", QAttrs>("q")
export const rp = _element<"rp", RpAttrs>("rp")
export const rt = _element<"rt", RtAttrs>("rt")
export const ruby = _element<"ruby", RubyAttrs>("ruby")
export const s = _element<"s", SAttrs>("s")
export const samp = _element<"samp", SAmpAttrs>("samp")
export const script = _element<"script", ScriptAttrs>("script")
export const search = _element<"search", SearchAttrs>("search")
export const section = _element<"section", SectionAttrs>("section")
export const select = _element<"select", SelectAttrs>("select")
export const slot = _element<"slot", SlotAttrs>("slot")
export const small = _element<"small", SmallAttrs>("small")
export const source = _element<"source", SourceAttrs>("source")
export const span = _element<"span", SpanAttrs>("span")
export const strong = _element<"strong", StrongAttrs>("strong")
export const style = _element<"style", StyleAttrs>("style")
export const sub = _element<"sub", SubAttrs>("sub")
export const summary = _element<"summary", SummaryAttrs>("summary")
export const sup = _element<"sup", SupAttrs>("sup")
export const table = _element<"table", TableAttrs>("table")
export const tbody = _element<"tbody", TBodyAttrs>("tbody")
export const td = _element<"td", TdAttrs>("td")
export const template = _element<"template", TemplateAttrs>("template")
export const textarea = _element<"textarea", TextAreaAttrs>("textarea")
export const tfoot = _element<"tfoot", TFootAttrs>("tfoot")
export const th = _element<"th", ThAttrs>("th")
export const thead = _element<"thead", THeadAttrs>("thead")
export const time = _element<"time", TimeAttrs>("time")
export const title = _element<"title", TitleAttrs>("title")
export const tr = _element<"tr", TrAttrs>("tr")
export const track = _element<"track", TrackAttrs>("track")
export const u = _element<"u", UAttrs>("u")
export const ul = _element<"ul", UlAttrs>("ul")
export const video = _element<"video", VideoAttrs>("video")
export const wbr = _element<"wbr", WbrAttrs>("wbr")

export type SVGAttrs = {[key: string]: string | false | null | undefined}

export function createSVGElement<T extends keyof SVGElementTagNameMap>(
    tag: T, attrs: SVGAttrs | null = null, ...children: HTMLChild[]): SVGElementTagNameMap[T] {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag)

  for (const [attr, value] of entries(attrs ?? {})) {
    if (value == null || value === false) {
      continue
    }
    element.setAttribute(attr, value)
  }

  function append(child: HTMLItem): void {
    if (isString(child)) {
      element.appendChild(document.createTextNode(child))
    } else if (child instanceof Node) {
      element.appendChild(child)
    } else if (child instanceof NodeList || child instanceof HTMLCollection) {
      for (const el of child) {
        element.appendChild(el)
      }
    } else if (child != null && child !== false) {
      throw new Error(`expected a DOM element, string, false or null, got ${JSON.stringify(child)}`)
    }
  }

  for (const child of children) {
    if (isArray(child)) {
      for (const _child of child) {
        append(_child)
      }
    } else {
      append(child)
    }
  }

  return element
}

export function text(str: string): Text {
  return document.createTextNode(str)
}

export function nbsp(): Text {
  return text("\u00a0")
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
    if (node.matches(selector)) {
      return node
    }
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

  if (margin == null) {
    style.margin = ""
  } else {
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
      if (item != null) {
        values.push(item)
      }
    }
    return values
  }

  has(cls: string): boolean {
    return this.class_list.contains(cls)
  }

  add(...classes: string[]): this {
    for (const cls of classes) {
      this.class_list.add(cls)
    }
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

  toggle(cls: string, activate?: boolean): boolean {
    return this.class_list.toggle(cls, activate)
  }
}

export function classes(el: HTMLElement): ClassList {
  return new ClassList(el.classList)
}

export function toggle_attribute(el: HTMLElement, attr: string, state?: boolean): void {
  if (state == null) {
    state = !el.hasAttribute(attr)
  }

  if (state) {
    el.setAttribute(attr, "true")
  } else {
    el.removeAttribute(attr)
  }
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
  protected override readonly el = style()

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
    this.el.remove()
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
    this.el.remove()
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

export function has_focus(el: Element): boolean {
  const root = el.getRootNode()
  if (root instanceof ShadowRoot || root instanceof Document) {
    return root.activeElement === el
  } else {
    return false
  }
}
