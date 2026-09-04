import {UIElement, UIElementView} from "./ui_element"
import {DOMNode} from "../dom/dom_node"
import {Coordinate} from "../coordinates/coordinate"
import {Selector} from "../selectors/selector"
import type {VAlign, HAlign} from "core/enums"
import {Anchor, TooltipAttachment} from "core/enums"
import type {StyleSheetLike} from "core/dom"
import {InlineStyleSheet, parent} from "core/dom"
import {bounding_box, box_size} from "core/dom"
import {UIComponent, cls} from "core/vdom"
import type {VNode} from "core/vdom"
import {DOMElementView, bokeh_element} from "core/dom_view"
import {isString, isArray} from "core/util/types"
import {BBox} from "core/util/bbox"
import {logger} from "core/logging"
import type {ChildView, ViewOf} from "core/build_views"
import {build_view} from "core/build_views"
import type * as p from "core/properties"
import {Model} from "model"

const NativeNode = globalThis.Node
type NativeNode = globalThis.Node

import * as tooltips_css from "styles/tooltips.css"
import * as icons_css from "styles/icons.css"

import {signal, computed, effect} from "@preact/signals"

// TODO add support for anchor positioning and remove observers and wheel event listeners
// const has_anchor_positioning = CSS.supports("top", "anchor(top)")

export class TooltipView extends UIElementView {
  declare readonly model: Tooltip
  declare readonly signals: p.SignalsOf<Tooltip.Props>

  override get is_top_level(): boolean {
    return this.parent == null || parent(this.target.value, (node) => bokeh_element in node) == null
  }

  protected _observer: ResizeObserver

  readonly position = new InlineStyleSheet()

  readonly target_override = signal<Element | null>(null)
  readonly target = computed(() => {
    const target_override = this.target_override.value
    const target = this.signals.target.value
    const el = (() => {
      if (target_override != null) {
        return target_override
      } else if (target instanceof UIElement) {
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

    const ell = (() => {
      if (el instanceof Element) {
        return el
      } else {
        logger.warn(`unable to resolve target '${target}' for '${this}'`)
        return document.body
      }
    })()

    this._observer.disconnect()
    this._observer.observe(ell)

    return ell
  })

  protected _element_view: ViewOf<DOMNode | UIElement> | null = null

  override _children_views(): ChildView[] {
    return [...super._children_views(), this._element_view]
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

    const content = this.signals.content.value
    if (content instanceof Model) {
      const view = await build_view(content, {parent: this})
      this._element_view = view
      view.render()
      view.r_after_render()
      this.computed_content.value = view.el
    } else {
      this.computed_content.value = content
    }
  }

  readonly computed_content = signal<string | NativeNode>("")

  private _scroll_listener?: () => void

  override connect_signals(): void {
    super.connect_signals()

    this._observer = new ResizeObserver(() => {
      this._reposition()
    })

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

    const {position, attachment, visible} = this.model.properties
    this.on_change([position, attachment, visible], () => {
      this._reposition()
    })

    effect(() => {
      void this._build_content()
    })
  }

  override disconnect_signals(): void {
    if (this._scroll_listener != null) {
      document.removeEventListener("scroll", this._scroll_listener, {capture: true})
      delete this._scroll_listener
    }
    this._observer.disconnect()
    super.disconnect_signals()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), tooltips_css.default, icons_css.default, this.position]
  }

  override component(): VNode {
    const {closable, show_arrow, interactive} = this.signals

    const closable_cls = closable.value ? tooltips_css.closable : null
    const show_arrow_cls = show_arrow.value ? tooltips_css.show_arrow  : null
    const interactive_cls = !interactive.value ? tooltips_css.non_interactive : null

    const content_el = (() => {
      const content = this.computed_content.value
      if (isString(content)) {
        return <div class={tooltips_css.tooltip_content}>{content}</div>
      } else {
        return <div class={tooltips_css.tooltip_content} ref={(el) => el?.replaceChildren(content)}/>
      }
    })()

    this._has_rendered = true
    return (
      <UIComponent parent={this.resolved_props} class={cls(closable_cls, show_arrow_cls, interactive_cls)} popover="manual">
        <div class={tooltips_css.arrow_outer}>
          <div class={tooltips_css.arrow}>
            <div class={tooltips_css.arrow_inner}/>
          </div>
        </div>
        {content_el}
        {closable.value ? <div class={tooltips_css.close} onClick={() => this.model.visible = false}/> : null}
      </UIComponent>
    )
  }

  private _has_rendered: boolean = false

  override _after_render(): void {
    super._after_render()
    this._reposition()
  }

  override _after_resize(): void {
    super._after_resize()
    this._reposition()
  }

  private _anchor_to_align(anchor: Anchor): {v: VAlign, h: HAlign} {
    const normalized_anchor = (() => {
      switch (anchor) {
        case "top":    return "top_center"
        case "bottom": return "bottom_center"
        case "left":   return "center_left"
        case "right":  return "center_right"
        default:       return anchor
      }
    })()
    const [v, h] = normalized_anchor.split("_") as [VAlign, HAlign]
    return {v, h}
  }

  protected _reposition(): void {
    const target = this.target.value
    const target_el = (() => {
      return target.shadowRoot ?? target
    })()

    if (!this._has_rendered) {
      this.render_to(target_el)
      this.r_after_render()
    } else {
      target_el.append(this.el)
    }

    const {position, visible} = this.model
    if (position == null || !visible) {
      this.el.hidePopover()
      return
    }

    if (!this.el.isConnected) {
      return
    }

    this.el.showPopover({source: target})

    const bbox = bounding_box(target)
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

    // TODO box_size(this.arrow_el), but currently doesn't work reliably
    const el_style = getComputedStyle(this.el)
    const arrow_size = {
      width: parseFloat(el_style.getPropertyValue("--tooltip-arrow-width")),
      height: parseFloat(el_style.getPropertyValue("--tooltip-arrow-height")),
    }

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
    this.class_list.remove(tooltips_css.right, tooltips_css.left, tooltips_css.above, tooltips_css.below)
    this.class_list.add((() => {
      switch (side) {
        case "left":  return tooltips_css.right
        case "right": return tooltips_css.left
        case "above": return tooltips_css.below
        case "below": return tooltips_css.above
      }
    })())

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

    this.position.replace(`
      ${this.host_selector} {
        left: ${left}px;
        top: ${top}px;
      }

      .${tooltips_css.arrow_outer} {
        left: ${sx}px;
        top: ${sy}px;
      }
    `)
  }

  // Compute on demand; remove when bbox support is redesigned
  override get bbox(): BBox {
    this._update_bbox()
    return super.bbox
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
