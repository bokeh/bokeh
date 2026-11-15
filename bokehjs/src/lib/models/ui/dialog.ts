import {UIElement, UIElementView} from "../ui/ui_element"
import {DOMNode} from "../dom/dom_node"
import {Signal} from "core/signaling"
import type {StyleSheetLike} from "core/dom"
import {InlineStyleSheet, px, div, text, bounding_box, dom_ready} from "core/dom"
import {isString} from "core/util/types"
import {typed_entries} from "core/util/object"
import type {PanEvent} from "core/ui_gestures"
import {UIGestures} from "core/ui_gestures"
import type {ChildView, ViewOf} from "core/build_views"
import {ChildViewSlot} from "core/build_views"
import type * as p from "core/properties"
import type {LRTB, Corners, BBox} from "core/util/bbox"
import {find, remove} from "core/util/array"
import {enumerate} from "core/util/iterator"
import {assert} from "core/util/assert"
import * as Box from "../common/box_kinds"
import type {HitTargets} from "../common/box_interaction"
import {resizable_edges, hittable, move_bbox, screen_limits} from "../common/box_interaction"
import {Node} from "../coordinates/node"
import {Nullable, Or, Ref} from "core/kinds"
import type {Infer} from "core/kinds"

import dialogs_css, * as dialogs from "styles/dialogs.css"
import icons_css from "styles/icons.css"

// Make sure this at least an order of magnitude lower than --bokeh-top-level.
const base_z_index = 1000

const UIElementLike = Or(Ref(UIElement), Ref(DOMNode))
type UIElementLike = Infer<typeof UIElementLike>

// Unlike `Box.Limit`, there are no data-space limits, because dialogs don't have scales.
const Limit = Nullable(Ref(Node))
type Limit = Infer<typeof Limit>

type CSSVal = number | string
type Position<T> =
  ({left: T, width: T} | {right: T, width: T}   | {left: T, right: T} | {width: T}) &
  ({top: T, height: T} | {bottom: T, height: T} | {top: T, bottom: T} | {height: T})
type CSSPosition = Position<CSSVal>

const _stacking_order: DialogView[] = []
// Defer DOM setup so importing this module doesn't require a browser environment.
let _minimization_area: HTMLElement | null = null

function minimization_area(): HTMLElement {
  if (_minimization_area != null) {
    return _minimization_area
  }

  const el = div()
  const shadow_el = el.attachShadow({mode: "open"})
  const stylesheet = new InlineStyleSheet(`
:host {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  position: fixed;
  left: 0;
  bottom: 0;
  width: max-content;
  height: max-content;
}
:host:empty {
  display: none;
}
`)
  shadow_el.adoptedStyleSheets = [stylesheet.to_native()]
  void dom_ready().then(() => document.body.append(el))
  return _minimization_area = el
}

export class DialogView extends UIElementView {
  declare model: Dialog

  override get is_top_level(): boolean {
    return true
  }

  protected readonly _title = new ChildViewSlot<UIElementLike>(this)
  protected readonly _content = new ChildViewSlot<UIElementLike>(this)

  override _children_views(): ChildView[] {
    return [...super._children_views(), this._title.view, this._content.view]
  }

  protected readonly _position = new InlineStyleSheet()
  protected readonly _stacking = new InlineStyleSheet()

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), dialogs_css, icons_css, this._position, this._stacking]
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._rebuild_title()
    await this._rebuild_content()
  }

  protected _rebuild_title(): Promise<boolean> {
    const {title} = this.model
    return this._title.build(isString(title) ? null : title)
  }

  protected _rebuild_content(): Promise<boolean> {
    const {content} = this.model
    return this._content.build(isString(content) ? null : content)
  }

  protected _slot_el(view: ViewOf<UIElementLike> | null, obj: string | UIElementLike | null): ChildNode {
    if (view != null) {
      view.render()
      return view.el
    } else {
      return text(isString(obj) ? obj : "")
    }
  }

  protected _title_el: HTMLElement
  protected _grip_el: HTMLElement
  protected _content_el: HTMLElement

  protected _update_title(): void {
    this._title_el.replaceChildren(this._grip_el, this._slot_el(this._title.view, this.model.title))
    this._title.view?.r_after_render()
  }

  protected _update_content(): void {
    this._content_el.replaceChildren(this._slot_el(this._content.view, this.model.content))
    this._content.view?.r_after_render()
  }

  override connect_signals(): void {
    super.connect_signals()

    const {visible, title, content} = this.model.properties
    this.connect(visible.change, () => this._toggle(this.model.visible))
    this.on_change(title, async () => {
      if (await this._rebuild_title() && this._has_rendered) {
        this._update_title()
      }
    })
    this.on_change(content, async () => {
      if (await this._rebuild_content() && this._has_rendered) {
        this._update_content()
      }
    })

    for (const ui_gestures of this._ui_gestures) {
      ui_gestures.connect_signals()
    }
    this.el.addEventListener("pointerdown", this._on_pointer_down)
    this._handles.area.addEventListener("wheel", this._on_title_wheel)
  }

  override disconnect_signals(): void {
    for (const ui_gestures of this._ui_gestures) {
      ui_gestures.disconnect_signals()
    }
    this.el.removeEventListener("pointerdown", this._on_pointer_down)
    this._handles.area.removeEventListener("wheel", this._on_title_wheel)
    super.disconnect_signals()
  }

  override remove(): void {
    remove(_stacking_order, this)
    super.remove()
  }

  protected _has_rendered: boolean = false

  protected readonly _handles: HitTargets<HTMLElement> = {
    // area
    area: div({class: dialogs.title}),
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

  /**
   * One recognizer per handle, so that only handles capture pointers, and the
   * dialog's controls and contents receive pointer events as usual.
   */
  protected readonly _ui_gestures: UIGestures[] = typed_entries(this._handles).map(([target, handle_el]) => {
    return new UIGestures(handle_el, {
      on_pan_start: (event) => this._on_pan_start(target, event),
      on_pan: (event) => this._on_pan(event),
      on_pan_end: (event) => this._on_pan_end(event),
      on_pan_cancel: (event) => this._on_pan_cancel(event),
    })
  })

  protected _pan_state: {bbox: BBox, target: Box.HitTarget} | null = null

  protected _on_pan_start(target: Box.HitTarget, _event: PanEvent): void {
    if (this._can_hit(target)) {
      this._pan_state = {bbox: bounding_box(this.el), target}
      this.el.classList.add(dialogs.interacting)
    }
  }

  protected _on_pan(event: PanEvent): void {
    const {_pan_state} = this
    if (_pan_state != null) {
      const {target, bbox} = _pan_state
      this._reposition(this._move_bbox(target, bbox, event.dx, event.dy))
    }
  }

  protected _on_pan_end(_event: PanEvent): void {
    this._pan_state = null
    this.el.classList.remove(dialogs.interacting)
  }

  protected _on_pan_cancel(event: PanEvent): void {
    const {_pan_state} = this
    if (_pan_state != null) {
      const {left, top, width, height} = _pan_state.bbox
      this._reposition({left, top, width, height})
    }
    this._on_pan_end(event)
  }

  protected _on_pointer_down = (event: PointerEvent): void => {
    this.bring_to_front()
    // prevent e.g. text selection when starting to move or resize the dialog
    const target = this._hit_target(event.composedPath())
    if (target != null && this._can_hit(target)) {
      event.preventDefault()
    }
  }

  protected _on_title_wheel = (event: WheelEvent): void => {
    const dy = event.deltaY
    if ((dy < 0 && !this._collapsed) || (0 < dy && this._collapsed)) {
      event.preventDefault()
      event.stopPropagation()
      this.collapse()
    }
  }

  protected _pin_el: HTMLElement
  protected _collapse_el: HTMLElement
  protected _minimize_el: HTMLElement
  protected _maximize_el: HTMLElement
  protected _close_el: HTMLElement

  protected _reposition(position: CSSPosition): void {
    this._position.replace(":host", {
      left: "left" in position ? px(position.left) : "unset",
      right: "right" in position ? px(position.right) : "unset",
      top: "top" in position ? px(position.top) : "unset",
      bottom: "bottom" in position ? px(position.bottom) : "unset",
      width: "width" in position ? px(position.width) : "unset",
      height: "height" in position ? px(position.height) : "unset",
    })

    this.update_bbox()
  }

  override render(): void {
    super.render()

    const inner_el = div({class: dialogs.inner})
    this.shadow_el.append(inner_el)

    const header_el = div({class: dialogs.header})
    const content_el = div({class: dialogs.content}, this._slot_el(this._content.view, this.model.content))
    this._content_el = content_el
    const footer_el = div({class: dialogs.footer})

    inner_el.append(header_el)
    inner_el.append(content_el)
    inner_el.append(footer_el)

    const grip_el = div({class: dialogs.grip})
    const title_el = this._handles.area
    title_el.replaceChildren(grip_el, this._slot_el(this._title.view, this.model.title))
    this._grip_el = grip_el
    this._title_el = title_el
    const controls_el = div({class: dialogs.controls})
    header_el.append(title_el, controls_el)

    const pin_el = div({class: [dialogs.ctrl, dialogs.pin], title: "Pin"})
    pin_el.addEventListener("click", () => this.pin())
    this._pin_el = pin_el

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

    if (this.model.pinnable) {
      controls_el.append(pin_el)
    }
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

    const handles = this._handles
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

    this._has_rendered = true

    if (this.model.visible) {
      this.bring_to_front()
    }
  }

  get resizable(): LRTB<boolean> & Corners<boolean> {
    return resizable_edges(this.model.resizable)
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
    if (this._minimized || this._maximized) {
      return false
    }
    const {resizable, movable} = this.model
    return hittable(resizable, movable != "none")[target]
  }

  protected _move_bbox(target: Box.HitTarget, bbox: BBox, dx: number, dy: number): BBox {
    const resolve = (dim: "x" | "y", limit: Limit): number => {
      return limit != null ? this.resolve_as_scalar(limit, dim) : NaN
    }

    const {movable, symmetric} = this.model
    const limits = screen_limits({
      left: resolve("x", this.model.left_limit),
      right: resolve("x", this.model.right_limit),
      top: resolve("y", this.model.top_limit),
      bottom: resolve("y", this.model.bottom_limit),
    })

    return move_bbox(bbox, target, dx, dy, {movable, symmetric, limits}).bbox
  }

  protected _pinned: boolean = false
  pin(): void {
    const {_pinned} = this
    for (const dialog_view of _stacking_order) {
      if (dialog_view == this) {
        this._pin(!_pinned)
      } else {
        dialog_view._pin(false)
      }
    }
    if (!_pinned) {
      this.bring_to_front()
    }
  }
  protected _pin(value: boolean): void {
    if (this._pinned != value) {
      this._pinned = value
      this.el.classList.toggle(dialogs.pinned, this._pinned)
      this._pin_el.title = this._pinned ? "Unpin" : "Pin"
    }
  }

  protected _normal_bbox: BBox | null = null

  protected _collapsed: boolean = false
  collapse(): void {
    const position = (() => {
      if (!this._collapsed) {
        this._minimize(false)
        this._maximize(false)
        if (this._normal_bbox == null) {
          this._normal_bbox = bounding_box(this.el)
        }
        const {left, top, width} = this._normal_bbox
        return {left, top, width, height: "max-content"}
      } else {
        const {_normal_bbox} = this
        assert(_normal_bbox != null)
        this._normal_bbox = null
        return _normal_bbox
      }
    })()
    this._reposition(position)
    this._collapse(!this._collapsed)
  }
  protected _collapse(value: boolean) {
    if (this._collapsed != value) {
      this._collapsed = value
      this.el.classList.toggle(dialogs.collapsed, this._collapsed)
      this._collapse_el.title = this._collapsed ? "Restore" : "Collapse"
    }
  }

  protected _minimized: boolean = false
  minimize(): void {
    const position = (() => {
      if (!this._minimized) {
        this._pin(false)
        this._collapse(false)
        this._maximize(false)
        if (this._normal_bbox == null) {
          this._normal_bbox = bounding_box(this.el)
        }
        return {width: "auto", height: "max-content"}
      } else {
        const {_normal_bbox} = this
        assert(_normal_bbox != null)
        this._normal_bbox = null
        return _normal_bbox
      }
    })()
    this._reposition(position)
    this._minimize(!this._minimized)
  }
  protected _minimize(value: boolean): void {
    if (this._minimized != value) {
      this._minimized = value
      const area = minimization_area()
      const target = value ? (area.shadowRoot ?? area) : document.body
      target.append(this.el)
      this.el.classList.toggle(dialogs.minimized, this._minimized)
      this._minimize_el.title = this._minimized ? "Restore" : "Minimize"
    }
  }

  protected _maximized: boolean = false
  maximize(): void {
    const position = (() => {
      if (!this._maximized) {
        this._collapse(false)
        this._minimize(false)
        if (this._normal_bbox == null) {
          this._normal_bbox = bounding_box(this.el)
        }
        return {left: 0, top: 0, width: "100%", height: "100%"}
      } else {
        const {_normal_bbox} = this
        assert(_normal_bbox != null)
        this._normal_bbox = null
        return _normal_bbox
      }
    })()
    this._reposition(position)
    this._maximize(!this._maximized)
  }
  protected _maximize(value: boolean): void {
    if (this._maximized != value) {
      this._maximized = value
      this.el.classList.toggle(dialogs.maximized, this._maximized)
      this._maximize_el.title = this._maximized ? "Restore" : "Maximize"
    }
  }

  restore(): void {
    this._collapse(false)
    this._minimize(false)
    this._maximize(false)
    const {_normal_bbox} = this
    if (_normal_bbox != null) {
      this._reposition(_normal_bbox)
      this._normal_bbox = null
    }
  }

  protected _toggle(show: boolean) {
    if (show) {
      const target = document.body
      if (!this._has_rendered) {
        this.render_to(target)
        this.r_after_render()
      }
      if (!this.el.isConnected) {
        target.append(this.el)
      }
      this.bring_to_front()
    } else {
      remove(_stacking_order, this)
      this.el.remove()
    }
  }

  readonly displayed = new Signal<boolean, this>(this, "displayed")

  get is_open(): boolean {
    return this.model.visible
  }

  toggle(force?: boolean): void {
    const visible = force ?? !this.model.visible
    this.model.setv({visible}, {check_eq: false})
    this.displayed.emit(visible)
  }

  open(): void {
    this.toggle(true)
  }

  close(): void {
    switch (this.model.close_action) {
      case "hide": {
        this.toggle(false)
        break
      }
      case "destroy": {
        this.remove()
        break
      }
    }
  }

  bring_to_front(): void {
    if (!_stacking_order.includes(this)) {
      _stacking_order.push(this)
    }
    const pinned = find(_stacking_order, (view) => view._pinned)
    if (pinned != null) {
      remove(_stacking_order, pinned)
    }
    remove(_stacking_order, this)
    _stacking_order.push(this)
    if (pinned != null) {
      _stacking_order.push(pinned)
    }

    for (const [dialog_view, i] of enumerate(_stacking_order)) {
      dialog_view._stacking.replace(":host", {
        "z-index": `${base_z_index + i}`,
      })
    }
  }
}

export namespace Dialog {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    title: p.Property<string | UIElementLike | null>
    content: p.Property<string | UIElementLike>

    pinnable: p.Property<boolean>
    collapsible: p.Property<boolean>
    minimizable: p.Property<boolean>
    maximizable: p.Property<boolean>
    closable: p.Property<boolean>

    close_action: p.Property<"hide" | "destroy">

    resizable: p.Property<Box.Resizable>
    movable: p.Property<Box.Movable>
    symmetric: p.Property<boolean>

    top_limit: p.Property<Limit>
    bottom_limit: p.Property<Limit>
    left_limit: p.Property<Limit>
    right_limit: p.Property<Limit>
  }
}

export interface Dialog extends Dialog.Attrs {}

export class Dialog extends UIElement {
  declare properties: Dialog.Props
  declare __view_type__: DialogView

  static {
    this.prototype.default_view = DialogView

    this.define<Dialog.Props>(({Bool, Str, Ref, Or, Nullable, Enum}) => ({
      title: [ Nullable(Or(Str, Ref(DOMNode), Ref(UIElement))), null ],
      content: [ Or(Str, Ref(DOMNode), Ref(UIElement)) ],

      pinnable: [ Bool, true ],
      collapsible: [ Bool, true ],
      minimizable: [ Bool, true ],
      maximizable: [ Bool, true ],
      closable: [ Bool, true ],

      close_action: [ Enum("hide", "destroy"), "destroy" ],

      resizable: [ Box.Resizable, "all" ],
      movable: [ Box.Movable, "both" ],
      symmetric: [ Bool, false ],

      top_limit: [ Limit, null ],
      bottom_limit: [ Limit, null ],
      left_limit: [ Limit, null ],
      right_limit: [ Limit, null ],
    }))
  }
}
