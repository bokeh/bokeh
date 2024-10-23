import {View} from "./view"
import type {SerializableState} from "./view"
import type {StyleSheet, StyleSheetLike} from "./dom"
import {create_element, empty, InlineStyleSheet, ClassList} from "./dom"
import {isString} from "./util/types"
import {assert} from "./util/assert"
import type {BBox} from "./util/bbox"
import base_css from "styles/base.css"

export interface DOMView extends View {
  constructor: Function & {tag_name: keyof HTMLElementTagNameMap}
}

export abstract class DOMView extends View {
  declare parent: DOMView | null

  static tag_name: keyof HTMLElementTagNameMap = "div"

  el: ChildNode
  shadow_el?: ShadowRoot

  get bbox(): BBox | undefined {
    return undefined
  }

  override serializable_state(): SerializableState {
    const state = super.serializable_state()
    const {bbox} = this
    return bbox != null ? {...state, bbox: bbox.round()} : state
  }

  get children_el(): Node {
    return this.shadow_el ?? this.el
  }

  override initialize(): void {
    super.initialize()
    this.el = this._create_element()
  }

  override remove(): void {
    this.el.remove()
    super.remove()
  }

  stylesheets(): StyleSheetLike[] {
    return []
  }

  css_classes(): string[] {
    return []
  }

  abstract render(): void

  rerender(): void {
    this.render()
    this.r_after_render()
  }

  render_to(target: Node): void {
    this.render()
    target.appendChild(this.el)
  }

  after_render(): void {
    this.reposition()
  }

  r_after_render(): void {
    for (const child_view of this.children()) {
      if (child_view instanceof DOMView) {
        child_view.r_after_render()
      }
    }
    this.after_render()
    this._was_built = true
  }

  protected _create_element(): this["el"] {
    return create_element(this.constructor.tag_name, {})
  }

  reposition(_displayed?: boolean): void {}

  protected _was_built: boolean = false

  /**
   * Build a top-level DOM view (e.g. during embedding).
   */
  build(target: Node): void {
    assert(this.is_root)
    this.render_to(target)
    this.r_after_render()
    this.notify_finished()
  }

  /**
   * Define where to render this element or let the parent decide.
   *
   * This is useful when creating "floating" components or adding
   * components to canvas' layers.
   */
  rendering_target(): HTMLElement | ShadowRoot | null {
    return null
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

  /**
   * Baseline stylesheets, e.g. imported CSS modules.
   */
  static_stylesheets(): StyleSheetLike[] {
    return this.stylesheets()
  }

  /**
   * Stylesheets computed by the component.
   */
  computed_stylesheets(): InlineStyleSheet[] {
    return []
  }

  /**
   * Other stylesheets, e.g. provided by user.
   */
  user_stylesheets(): StyleSheetLike[] {
    return []
  }

  empty(): void {
    empty(this.shadow_el)
    this.class_list.clear()
    this._applied_css_classes = []
    this._applied_stylesheets = []
    for (const stylesheet of this.computed_stylesheets()) {
      stylesheet.clear()
    }
  }

  render(): void {
    this.empty()
    this._update_stylesheets()
    this._update_css_classes()
    this._update_css_variables()
  }

  override reposition(_displayed?: boolean): void {
    this._update_css_variables() // TODO remove this when node invalidation is implemented
  }

  protected *_stylesheets(): Iterable<StyleSheetLike> {
    yield* this.static_stylesheets()
    yield* this.computed_stylesheets()
    yield* this.user_stylesheets()
  }

  protected *_css_classes(): Iterable<string> {
    yield `bk-${this.model.type.replace(/\./g, "-")}`
    yield* this.css_classes()
  }

  protected *_css_variables(): Iterable<[string, string]> {}

  protected _applied_stylesheets: StyleSheet[] = []
  protected _apply_stylesheets(stylesheets: StyleSheetLike[]): void {
    const resolved_stylesheets = stylesheets.map((style) => isString(style) ? new InlineStyleSheet(style) : style)
    this._applied_stylesheets.push(...resolved_stylesheets)
    resolved_stylesheets.forEach((stylesheet) => stylesheet.install(this.shadow_el))
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

  protected _update_css_variables(): void {
    for (const [name, value] of this._css_variables()) {
      const full_name = name.startsWith("--") ? name : `--${name}`
      this.el.style.setProperty(full_name, value)
    }
  }
}
