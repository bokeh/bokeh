import {View} from "./view"
import type {StyleSheet, StyleSheetLike} from "./dom"
import {createElement, remove, empty, InlineStyleSheet, ClassList} from "./dom"
import {isString} from "./util/types"
import base_css from "styles/base.css"

export interface DOMView extends View {
  constructor: Function & {tag_name: keyof HTMLElementTagNameMap}
}

export abstract class DOMView extends View {
  declare parent: DOMView | null

  static tag_name: keyof HTMLElementTagNameMap = "div"

  el: Node
  shadow_el?: ShadowRoot

  get children_el(): Node {
    return this.shadow_el ?? this.el
  }

  override initialize(): void {
    super.initialize()
    this.el = this._createElement()
  }

  override remove(): void {
    remove(this.el)
    super.remove()
  }

  stylesheets(): StyleSheetLike[] {
    return []
  }

  css_classes(): string[] {
    return []
  }

  abstract render(): void

  render_to(target: Node | null): void {
    if (target != null) {
      target.appendChild(this.el)
    }
    this.render()
  }

  finish(): void {
    this._has_finished = true
    this.notify_finished()
  }

  protected _createElement(): this["el"] {
    return createElement(this.constructor.tag_name, {class: this.css_classes()})
  }
}

export abstract class DOMElementView extends DOMView {
  declare el: HTMLElement

  class_list: ClassList

  override initialize(): void {
    super.initialize()
    this.class_list = new ClassList(this.el.classList)
  }
}

export abstract class DOMComponentView extends DOMElementView {
  declare parent: DOMElementView | null
  declare readonly root: DOMComponentView

  declare shadow_el: ShadowRoot

  override initialize(): void {
    super.initialize()
    this.shadow_el = this.el.attachShadow({mode: "open"})
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), base_css]
  }

  empty(): void {
    empty(this.shadow_el)
    this.class_list.clear()
    this._applied_css_classes = []
    this._applied_stylesheets = []
  }

  render(): void {
    this.empty()
    this._update_stylesheets()
    this._update_css_classes()
  }

  protected *_stylesheets(): Iterable<StyleSheet> {
    for (const style of this.stylesheets()) {
      yield isString(style) ? new InlineStyleSheet(style) : style
    }
  }

  protected *_css_classes(): Iterable<string> {
    yield `bk-${this.model.type.replace(/\./g, "-")}`
    yield* this.css_classes()
  }

  protected _applied_stylesheets: StyleSheet[] = []
  protected _apply_stylesheets(stylesheets: StyleSheet[]): void {
    this._applied_stylesheets.push(...stylesheets)
    stylesheets.forEach((stylesheet) => stylesheet.install(this.shadow_el))
  }

  protected _applied_css_classes: string[] = []
  protected _apply_css_classes(classes: string[]): void {
    this._applied_css_classes.push(...classes)
    this.class_list.add(...classes)
  }

  protected _update_stylesheets(): void {
    this._applied_stylesheets.forEach((stylesheet) => stylesheet.uninstall())
    this._applied_stylesheets = []
    this._apply_stylesheets([...this._stylesheets()])
  }

  protected _update_css_classes(): void {
    this.class_list.remove(this._applied_css_classes)
    this._applied_css_classes = []
    this._apply_css_classes([...this._css_classes()])
  }
}
