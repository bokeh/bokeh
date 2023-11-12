import {UIElement, UIElementView} from "../ui/ui_element"
import type {DOMNodeView} from "../dom/dom_node"
import {DOMNode} from "../dom/dom_node"
import {Text} from "../dom/text"
import type {StyleSheetLike, Keys} from "core/dom"
import {div, bounding_box} from "core/dom"
import {isString, isNumber} from "core/util/types"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import type * as p from "core/properties"
import type {XY, LRTB} from "core/util/bbox"
import {BBox} from "core/util/bbox"
import {min as amin} from "core/util/array"
import {assert} from "core/util/assert"
import * as Box from "../common/box_kinds"
import {Node} from "../coordinates/node"

import dialogs_css, * as dialogs from "styles/dialogs.css"
import icons_css from "styles/icons.css"

type Button = UIElement
const Button = UIElement

type CSSVal = number | string
type Position<T> =
  ({left: T, width: T} | {right: T, width: T} | {left: T, right: T}) &
  ({top: T, height: T} | {bottom: T, height: T} | {top: T, bottom: T})
type CSSPosition = Position<CSSVal>

function _update_css(style: CSSStyleDeclaration, key: string, val: number | string | null | undefined): void {
  if (val != null) {
    style.setProperty(key, isNumber(val) ? `${val}px` : val)
  } else {
    style.removeProperty(key)
  }
}

function reposition(el: HTMLElement, position: CSSPosition): void {
  const {style} = el

  const left = "left" in position ? position.left : "unset"
  _update_css(style, "left", left)

  const right = "right" in position ? position.right : "unset"
  _update_css(style, "right", right)

  const top = "top" in position ? position.top : "unset"
  _update_css(style, "top", top)

  const bottom = "bottom" in position ? position.bottom : "unset"
  _update_css(style, "bottom", bottom)

  const width = "width" in position ? position.width : "unset"
  _update_css(style, "width", width)

  const height = "height" in position ? position.height : "unset"
  _update_css(style, "height", height)
}

export class DialogView extends UIElementView {
  declare model: Dialog

  protected _title: DOMNodeView
  protected _content: DOMNodeView

  override *children(): IterViews {
    yield* super.children()
    yield this._content
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), dialogs_css, icons_css]
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const title = (() => {
      const {title} = this.model
      return isString(title) || title == null ? new Text({content: title ?? ""}) : title
    })()

    const content = (() => {
      const {content} = this.model
      return isString(content) ? new Text({content}) : content
    })()

    this._title = await build_view(title, {parent: this})
    this._content = await build_view(content, {parent: this})
  }

  override connect_signals(): void {
    super.connect_signals()

    const {visible} = this.model.properties
    this.on_change(visible, () => {
      if (this.model.visible) {
        if (!this._has_rendered) {
          this.render()
        } else {
          document.body.append(this.el)
        }
      } else {
        this.el.remove()
      }
    })
  }

  override remove(): void {
    this._content.remove()
    super.remove()
  }

  protected _has_rendered: boolean = false

  protected _handles: {[key in Box.HitTarget]: HTMLElement}

  protected _collapse_el: HTMLElement
  protected _minimize_el: HTMLElement
  protected _maximize_el: HTMLElement
  protected _close_el: HTMLElement

  protected _reposition(position: CSSPosition): void {
    reposition(this.el, position)
    this.update_bbox()
  }

  override render(): void {
    super.render()

    this._title.render()
    this._content.render()

    const inner_el = div({class: dialogs.inner})
    this.shadow_el.append(inner_el)

    const header_el = div({class: dialogs.header})
    const content_el = div({class: dialogs.content}, this._content.el)
    const footer_el = div({class: dialogs.footer})

    inner_el.append(header_el)
    inner_el.append(content_el)
    inner_el.append(footer_el)

    const grip_el = div({class: dialogs.grip})
    const title_el = div({class: dialogs.title}, grip_el, this._title.el)
    const controls_el = div({class: dialogs.controls})
    header_el.append(title_el, controls_el)

    const collapse_el = div({class: [dialogs.ctrl, dialogs.collapse], title: "Collapse"})
    collapse_el.addEventListener("click", () => this.collapse())
    this._collapse_el = collapse_el

    const minimize_el = div({class: [dialogs.ctrl, dialogs.minimize], title: "Minimize"})
    minimize_el.addEventListener("click", () => this.minimize())
    this._minimize_el = minimize_el

    const maximize_el = div({class: [dialogs.ctrl, dialogs.maximize], title: "Maximize"})
    maximize_el.addEventListener("click", () => this.maximize())
    this._maximize_el = maximize_el

    const close_el = div({class: [dialogs.ctrl, dialogs.close], title: "Close"})
    close_el.addEventListener("click", () => this.close())
    this._close_el = close_el

    if (this.model.collapsible) {
      controls_el.append(collapse_el)
    }
    if (this.model.minimizable) {
      controls_el.append(minimize_el)
    }
    if (this.model.maximizable) {
      controls_el.append(maximize_el)
    }
    if (this.model.closable) {
      controls_el.append(close_el)
    }

    const handles = this._handles = {
      // area
      area: title_el,
      // edges
      top: div({class: [dialogs.handle, dialogs.resize_top]}),
      bottom: div({class: [dialogs.handle, dialogs.resize_bottom]}),
      left: div({class: [dialogs.handle, dialogs.resize_left]}),
      right: div({class: [dialogs.handle, dialogs.resize_right]}),
      // corners
      top_left: div({class: [dialogs.handle, dialogs.resize_top_left]}),
      top_right: div({class: [dialogs.handle, dialogs.resize_top_right]}),
      bottom_left: div({class: [dialogs.handle, dialogs.resize_bottom_left]}),
      bottom_right: div({class: [dialogs.handle, dialogs.resize_bottom_right]}),
    }
    this.shadow_el.append(
      handles.top,
      handles.bottom,
      handles.left,
      handles.right,
      handles.top_left,
      handles.top_right,
      handles.bottom_left,
      handles.bottom_right,
    )

    let state: {bbox: BBox, xy: XY, target: Box.HitTarget} | null = null
    const cancel = () => {
      state = null
      document.removeEventListener("pointermove", pointer_move)
      document.removeEventListener("pointerup", pointer_up)
      document.removeEventListener("keydown", key_press)
      this.el.classList.remove(dialogs.interacting)
      document.body.style.cursor = ""
    }
    const pointer_move = (event: PointerEvent) => {
      assert(state != null)
      event.preventDefault()
      this.el.classList.add(dialogs.interacting)
      const dx = event.x - state.xy.x
      const dy = event.y - state.xy.y
      const {target, bbox} = state
      const delta_bbox = this._move_bbox(target, bbox, dx, dy)
      this._reposition(delta_bbox)
    }
    const pointer_up = (event: PointerEvent) => {
      assert(state != null)
      event.preventDefault()
      cancel()
    }
    const key_press = (event: KeyboardEvent) => {
      if (event.key as Keys == "Escape") {
        assert(state != null)
        event.preventDefault()
        const {left, top, width, height} = state.bbox
        this._reposition({left, top, width, height})
        cancel()
      }
    }
    this.el.addEventListener("pointerdown", (event) => {
      assert(state == null)

      const target = this._hit_target(event.composedPath())
      if (target == null || !this._can_hit(target)) {
        return
      }

      event.preventDefault()

      const {x, y} = event
      state = {
        bbox: bounding_box(this.el),
        xy: {x, y},
        target,
      }

      document.addEventListener("pointermove", pointer_move)
      document.addEventListener("pointerup", pointer_up)
      document.addEventListener("keydown", key_press)

      const target_el = this._handles[target]
      const {cursor} = getComputedStyle(target_el)
      document.body.style.cursor = cursor

      this.el.setPointerCapture(event.pointerId)
    })

    if (this.model.visible) {
      document.body.append(this.el)
    } else {
      this.el.remove()

    }
    this._has_rendered = true
  }

  get resizable(): LRTB<boolean> {
    const {resizable} = this.model
    return {
      left: resizable == "left" || resizable == "x" || resizable == "all",
      right: resizable == "right" || resizable == "x" || resizable == "all",
      top: resizable == "top" || resizable == "y" || resizable == "all",
      bottom: resizable == "bottom" || resizable == "y" || resizable == "all",
    }
  }

  protected _hit_target(path: EventTarget[]): Box.HitTarget | null {
    const {_handles} = this
    for (const el of path) {
      switch (el) {
        case _handles.area:         return "area"
        case _handles.top:          return "top"
        case _handles.bottom:       return "bottom"
        case _handles.left:         return "left"
        case _handles.right:        return "right"
        case _handles.top_left:     return "top_left"
        case _handles.top_right:    return "top_right"
        case _handles.bottom_left:  return "bottom_left"
        case _handles.bottom_right: return "bottom_right"
      }
    }
    return null
  }

  protected _can_hit(target: Box.HitTarget): boolean {
    if (this._maximized) {
      return false
    }
    const {left, right, top, bottom} = this.resizable
    switch (target) {
      case "top_left":     return top && left
      case "top_right":    return top && right
      case "bottom_left":  return bottom && left
      case "bottom_right": return bottom && right
      case "left":         return left
      case "right":        return right
      case "top":          return top
      case "bottom":       return bottom
      case "area":         return this.model.movable != "none"
    }
  }

  protected _move_bbox(target: Box.HitTarget, bbox: BBox, dx: number, dy: number): BBox {
    const resolve = (_dim: "x" | "y", limit: Node | number | null): number => {
      if (limit instanceof Node) {
        return NaN // this.resolve_node(limit)[dim]
      } else {
        return NaN
      }
    }

    const slimits = BBox.from_lrtb({
      left: resolve("x", this.model.left_limit),
      right: resolve("x", this.model.right_limit),
      top: resolve("y", this.model.top_limit),
      bottom: resolve("y", this.model.bottom_limit),
    })

    const [dl, dr, dt, db] = (() => {
      const {symmetric} = this.model
      const [Dx, Dy] = symmetric ? [-dx, -dy] : [0, 0]

      switch (target) {
        // corners
        case "top_left":     return [dx, Dx, dy, Dy]
        case "top_right":    return [Dx, dx, dy, Dy]
        case "bottom_left":  return [dx, Dx, Dy, dy]
        case "bottom_right": return [Dx, dx, Dy, dy]
        // edges
        case "left":   return [dx, Dx, 0, 0]
        case "right":  return [Dx, dx, 0, 0]
        case "top":    return [0, 0, dy, Dy]
        case "bottom": return [0, 0, Dy, dy]
        // area
        case "area": {
          switch (this.model.movable) {
            case "both": return [dx, dx, dy, dy]
            case "x":    return [dx, dx,  0,  0]
            case "y":    return [ 0,  0, dy, dy]
            case "none": return [ 0,  0,  0,  0]
          }
        }
      }
    })()

    const min = (a: number, b: number) => amin([a, b])
    const sgn = (v: number) => v < 0 ? -1 : (v > 0 ? 1 : 0)

    let {left, right, left_sign, right_sign} = (() => {
      const left = bbox.left + dl
      const right = bbox.right + dr
      const left_sign = sgn(dl)
      const right_sign = sgn(dr)
      if (left <= right) {
        return {left, right, left_sign, right_sign}
      } else {
        return {left: right, right: left, left_sign: right_sign, right_sign: left_sign}
      }
    })()
    let {top, bottom, top_sign, bottom_sign} = (() => {
      const top = bbox.top + dt
      const bottom = bbox.bottom + db
      const top_sign = sgn(dt)
      const bottom_sign = sgn(db)
      if (top <= bottom) {
        return {top, bottom, top_sign, bottom_sign}
      } else {
        return {top: bottom, bottom: top, top_sign: bottom_sign, bottom_sign: top_sign}
      }
    })()

    const Dl = left - slimits.left
    const Dr = slimits.right - right

    const Dh = min(Dl < 0 ? Dl : NaN, Dr < 0 ? Dr : NaN)
    if (isFinite(Dh) && Dh < 0) {
      left += -left_sign*(-Dh)
      right += -right_sign*(-Dh)
    }

    const Dt = top - slimits.top
    const Db = slimits.bottom - bottom

    const Dv = min(Dt < 0 ? Dt : NaN, Db < 0 ? Db : NaN)
    if (isFinite(Dv) && Dv < 0) {
      top += -top_sign*(-Dv)
      bottom += -bottom_sign*(-Dv)
    }

    return BBox.from_lrtb({left, right, top, bottom})
  }

  protected _normal_bbox: BBox | null = null

  protected _collapsed: boolean = false
  collapse(): void {
    if (!this._collapsed) {
      if (this._normal_bbox == null) {
        this._normal_bbox = bounding_box(this.el)
      }
      const {left, top, width} = this._normal_bbox
      this._reposition({left, top, width, height: "max-content"})
      this._minimize_el.title = "Restore"
    } else {
      assert(this._normal_bbox != null)
      this._reposition(this._normal_bbox)
      this._minimize_el.title = "Collapse"
      this._normal_bbox = null
    }
    this._collapsed = !this._collapsed
    this.el.classList.toggle(dialogs.collapsed, this._collapsed)
  }

  protected _minimized: boolean = false
  minimize(): void {
    if (!this._minimized) {
      if (this._normal_bbox == null) {
        this._normal_bbox = bounding_box(this.el)
      }
      this._reposition({left: 0, bottom: 0, width: "max-content", height: "max-content"})
      this._minimize_el.title = "Restore"
    } else {
      assert(this._normal_bbox != null)
      this._reposition(this._normal_bbox)
      this._minimize_el.title = "Minimize"
      this._normal_bbox = null
    }
    this._minimized = !this._minimized
    this.el.classList.toggle(dialogs.minimized, this._minimized)
  }

  protected _maximized: boolean = false
  maximize(): void {
    if (!this._maximized) {
      if (this._normal_bbox == null) {
        this._normal_bbox = bounding_box(this.el)
      }
      this._reposition({left: 0, top: 0, width: "100%", height: "100%"})
      this._maximize_el.title = "Restore"
    } else {
      assert(this._normal_bbox != null)
      this._reposition(this._normal_bbox)
      this._maximize_el.title = "Maximize"
      this._normal_bbox = null
    }
    this._maximized = !this._maximized
    this.el.classList.toggle(dialogs.maximized, this._maximized)
  }

  open(): void {
    if (this.model.visible && !this._has_rendered) {
      this.render()
    } else {
      this.model.visible = true
    }
  }

  close(): void {
    this.model.visible = false
  }
}

export namespace Dialog {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    title: p.Property<string | DOMNode | null>
    content: p.Property<string | DOMNode | UIElement>
    buttons: p.Property<Button[]>

    //modal: p.Property<boolean>
    collapsible: p.Property<boolean>
    minimizable: p.Property<boolean>
    maximizable: p.Property<boolean>
    closable: p.Property<boolean>

    resizable: p.Property<Box.Resizable>
    movable: p.Property<Box.Movable>
    symmetric: p.Property<boolean>

    top_limit: p.Property<Box.Limit>
    bottom_limit: p.Property<Box.Limit>
    left_limit: p.Property<Box.Limit>
    right_limit: p.Property<Box.Limit>
  }
}

export interface Dialog extends Dialog.Attrs {}

export class Dialog extends UIElement {
  declare properties: Dialog.Props
  declare __view_type__: DialogView

  constructor(attrs?: Partial<Dialog.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DialogView

    this.define<Dialog.Props>(({Boolean, String, Array, Ref, Or, Nullable}) => ({
      title: [ Nullable(Or(String, Ref(DOMNode))), null ],
      content: [ Or(String, Ref(DOMNode), Ref(UIElement)) ],
      buttons: [ Array(Ref(Button)), [] ],

      //modal: [ Boolean, false ],
      collapsible: [ Boolean, true ],
      minimizable: [ Boolean, true ],
      maximizable: [ Boolean, true ],
      closable: [ Boolean, true ],

      resizable: [ Box.Resizable, "all" ],
      movable: [ Box.Movable, "both" ],
      symmetric: [ Boolean, false ],

      top_limit: [ Box.Limit, null ],
      bottom_limit: [ Box.Limit, null ],
      left_limit: [ Box.Limit, null ],
      right_limit: [ Box.Limit, null ],
    }))
  }
}
