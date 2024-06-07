import {UIElement, UIElementView} from "./ui_element"
import {DOMNode} from "../dom/dom_node"
import {Coordinate} from "../coordinates/coordinate"
import {Selector} from "../selectors/selector"
import type {VAlign, HAlign} from "core/enums"
import {Anchor, TooltipAttachment} from "core/enums"
import type {StyleSheetLike} from "core/dom"
import {div, bounding_box, box_size} from "core/dom"
import {DOMElementView} from "core/dom_view"
import {isString, isArray} from "core/util/types"
import {assert} from "core/util/assert"
import {BBox} from "core/util/bbox"
import {logger} from "core/logging"
import type {IterViews, ViewOf} from "core/build_views"
import {build_view} from "core/build_views"
import type * as p from "core/properties"
import {Model} from "model"

const NativeNode = globalThis.Node
type NativeNode = globalThis.Node

import tooltips_css, * as tooltips from "styles/tooltips.css"
import icons_css from "styles/icons.css"

export class TooltipView extends UIElementView {
  declare model: Tooltip

  protected arrow_el: HTMLElement
  protected content_el: HTMLElement
  protected _observer: ResizeObserver

  private _target: Element
  get target(): Element {
    return this._target
  }
  set target(el: Element) {
    this._target = el
  }

  protected _init_target(): void {
    const {target} = this.model
    const el = (() => {
      if (target instanceof UIElement) {
        return this.owner.find_one(target)?.el ?? null
      } else if (target instanceof Selector) {
        return target.find_one(document)
      } else if (target instanceof NativeNode) {
        return target
      } else {
        const {parent} = this
        return parent instanceof DOMElementView ? parent.el : null
      }
    })()

    if (el instanceof Element) {
      this._target = el
    } else {
      logger.warn(`unable to resolve target '${target}' for '${this}'`)
      this._target = document.body
    }
  }

  override initialize(): void {
    super.initialize()
    this._init_target()
  }

  protected _element_view: ViewOf<DOMNode | UIElement> | null = null

  override *children(): IterViews {
    yield* super.children()
    if (this._element_view != null) {
      yield this._element_view
    }
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._build_content()
  }

  protected async _build_content(): Promise<void> {
    if (this._element_view != null) {
      this._element_view.remove()
      this._element_view = null
    }

    const {content} = this.model
    if (content instanceof Model) {
      this._element_view = await build_view(content, {parent: this})
    }
  }

  private _scroll_listener?: () => void

  override connect_signals(): void {
    super.connect_signals()

    this._observer = new ResizeObserver(() => {
      this._reposition()
    })
    this._observer.observe(this.target)

    let throttle = false
    document.addEventListener("scroll", this._scroll_listener = () => {
      if (!throttle) {
        requestAnimationFrame(() => {
          this._reposition()
          throttle = false
        })

        throttle = true
      }
    }, {capture: true})

    const {target, content, closable, interactive, position, attachment, visible} = this.model.properties
    this.on_change(target, () => {
      this._init_target()
      this._observer.disconnect()
      this._observer.observe(this.target)
      this.render()
      this.after_render()
    })
    this.on_change(content, async () => {
      await this._build_content()
      this.render()
      this.after_render()
    })
    this.on_change([closable, interactive], () => {
      this.render()
      this.after_render()
    })
    this.on_change([position, attachment, visible], () => {
      this._reposition()
    })
  }

  override disconnect_signals(): void {
    if (this._scroll_listener != null) {
      document.removeEventListener("scroll", this._scroll_listener, {capture: true})
      delete this._scroll_listener
    }
    super.disconnect_signals()
  }

  override remove(): void {
    this._element_view?.remove()
    this._observer.disconnect()
    super.remove()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), tooltips_css, icons_css]
  }

  get content(): NativeNode {
    const {content} = this.model
    if (isString(content)) {
      return document.createTextNode(content)
    } else if (content instanceof Model) {
      assert(this._element_view != null)
      return this._element_view.el
    } else {
      return content
    }
  }

  private _has_rendered: boolean = false

  override render(): void {
    super.render()

    const {_element_view} = this
    if (_element_view != null) {
      _element_view.render()
      _element_view.r_after_render()
    }
    this.arrow_el = div({class: [tooltips.arrow]})
    this.content_el = div({class: tooltips.tooltip_content}, this.content)
    this.shadow_el.append(this.arrow_el, this.content_el)

    this.class_list.toggle(tooltips.closable, this.model.closable)
    const close_el = div({class: tooltips.close})
    this.shadow_el.append(close_el)
    close_el.addEventListener("click", () => {
      this.model.visible = false
    })

    this.el.classList.toggle(tooltips.show_arrow, this.model.show_arrow)
    this.el.classList.toggle(tooltips.non_interactive, !this.model.interactive)

    this._has_rendered = true
  }

  override _after_render(): void {
    super._after_render()
    this._reposition()
  }

  override _after_resize(): void {
    super._after_resize()
    this._reposition()
  }

  private _anchor_to_align(anchor: Anchor): {v: VAlign, h: HAlign} {
    anchor = (() => {
      switch (anchor) {
        case "top":    return "top_center"
        case "bottom": return "bottom_center"
        case "left":   return "center_left"
        case "right":  return "center_right"
        default:       return anchor
      }
    })()
    const [v, h] = anchor.split("_") as [VAlign, HAlign]
    return {v, h}
  }

  protected _reposition(): void {
    // Append to `body` to deal with CSS' `contain` interaction
    // with `position: fixed`. We assume initial containment
    // block in this function, but `contain` can introduce a
    // new containment block and offset tooltip's position.
    const target = document.body.shadowRoot ?? document.body

    if (!this._has_rendered) {
      this.render_to(target)
      this.after_render()
      return                 // render() calls _reposition()
    }

    const {position, visible} = this.model
    if (position == null || !visible) {
      this.el.remove()
      return
    }

    target.append(this.el)

    const bbox = bounding_box(this.target)
    const [sx, sy] = (() => {
      if (isString(position)) {
        const {v: v_align, h: h_align} = this._anchor_to_align(position)
        const sx = (() => {
          switch (h_align) {
            case "left": return bbox.left
            case "center": return bbox.hcenter
            case "right": return bbox.right
          }
        })()
        const sy = (() => {
          switch (v_align) {
            case "top": return bbox.top
            case "center": return bbox.vcenter
            case "bottom": return bbox.bottom
          }
        })()
        return [sx, sy]
      } else if (isArray(position)) {
        const [x, y] = position
        return [bbox.left + x, bbox.top + y]
      } else {
        // XXX this assumes position is resolved relative to this.target
        const {x, y} = this.resolve_as_xy(position)
        return [bbox.left + x, bbox.top + y]
      }
    })()

    const viewport = new BBox({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    })

    const arrow_size = box_size(this.arrow_el)

    const side = (() => {
      const attachment = (() => {
        const {attachment} = this.model
        if (attachment == "auto") {
          if (isString(position)) {
            const {v: v_align, h: h_align} = this._anchor_to_align(position)
            if (h_align != "center") {
              return h_align == "left" ? "left" : "right"
            }
            if (v_align != "center") {
              return v_align == "top" ? "above" : "below"
            }
          }
          return "horizontal"
        } else {
          return attachment
        }
      })()

      const el_size = box_size(this.el)

      const width = el_size.width + arrow_size.width
      const height = el_size.height + arrow_size.height

      switch (attachment) {
        case "horizontal": {
          if (sx < bbox.hcenter) {
            return sx + width <= viewport.right ? "right" : "left"
          } else {
            return sx - width >= viewport.left ? "left" : "right"
          }
        }
        case "vertical": {
          if (sy < bbox.vcenter) {
            return sy + height <= viewport.bottom ? "below" : "above"
          } else {
            return sy - height >= viewport.top ? "above" : "below"
          }
        }
        default:
          return attachment
      }
    })()

    // slightly confusing: side "left" (for example) is relative to point that
    // is being annotated but CS class ".bk-left" is relative to the tooltip itself
    this.class_list.remove(tooltips.right, tooltips.left, tooltips.above, tooltips.below)
    this.class_list.add((() => {
      switch (side) {
        case "left":  return tooltips.right
        case "right": return tooltips.left
        case "above": return tooltips.below
        case "below": return tooltips.above
      }
    })())

    this.arrow_el.style.left = `${sx}px`
    this.arrow_el.style.top = `${sy}px`

    const {left, top} = (() => {
      const {width, height} = box_size(this.el)

      function adjust_top(top: number) {
        if (top < viewport.top) {
          return viewport.top
        } else if (top + height > viewport.bottom) {
          return viewport.bottom - height
        } else {
          return top
        }
      }

      function adjust_left(left: number) {
        if (left < viewport.left) {
          return viewport.left
        } else if (left + width > viewport.right) {
          return viewport.right - width
        } else {
          return left
        }
      }

      switch (side) {
        case "left": {
          return {
            left: sx - width - arrow_size.width,
            top: adjust_top(sy - height/2),
          }
        }
        case "right": {
          return {
            left: sx + arrow_size.width,
            top: adjust_top(sy - height/2),
          }
        }
        case "above": {
          return {
            left: adjust_left(sx - width/2),
            top: sy - height - arrow_size.height,
          }
        }
        case "below": {
          return {
            left: adjust_left(sx - width/2),
            top: sy + arrow_size.height,
          }
        }
      }
    })()

    this.el.style.top = `${top}px`
    this.el.style.left = `${left}px`
  }
}

export namespace Tooltip {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    target: p.Property<UIElement | Selector | NativeNode | "auto">
    position: p.Property<Anchor | [number, number] | Coordinate | null>
    content: p.Property<string | DOMNode | UIElement | NativeNode>
    attachment: p.Property<TooltipAttachment | "auto">
    show_arrow: p.Property<boolean>
    closable: p.Property<boolean>
    interactive: p.Property<boolean>
  }
}

export interface Tooltip extends Tooltip.Attrs {}

export class Tooltip extends UIElement {
  declare properties: Tooltip.Props
  declare __view_type__: TooltipView

  constructor(attrs?: Partial<Tooltip.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TooltipView

    this.define<Tooltip.Props>(({Bool, Float, Str, Tuple, Or, Ref, Nullable, Auto}) => ({
      target: [ Or(Ref(UIElement), Ref(Selector), Ref(NativeNode), Auto), "auto" ],
      position: [ Nullable(Or(Anchor, Tuple(Float, Float), Ref(Coordinate))), null ],
      content: [ Or(Str, Ref(DOMNode), Ref(UIElement), Ref(NativeNode)) ],
      attachment: [ Or(TooltipAttachment, Auto), "auto" ],
      show_arrow: [ Bool, true ],
      closable: [ Bool, false ],
      interactive: [ Bool, true ],
    }))

    this.override<Tooltip.Props>({
      visible: false,
    })
  }

  show({x, y}: {x: number, y: number}): void {
    this.setv({position: [x, y], visible: true}, {check_eq: false}) // XXX: force update
  }

  clear(): void {
    this.position = null
  }
}
