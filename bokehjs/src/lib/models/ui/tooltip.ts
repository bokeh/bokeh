import {UIElement, UIElementView} from "./ui_element"
import {Selector} from "../selectors/selector"
import type {HTMLView} from "../dom/html"
import {HTML} from "../dom/html"
import type {VAlign, HAlign} from "core/enums"
import {Anchor, TooltipAttachment} from "core/enums"
import type {StyleSheetLike} from "core/dom"
import {div, bounding_box, box_size} from "core/dom"
import {DOMElementView} from "core/dom_view"
import {isString} from "core/util/types"
import {assert} from "core/util/assert"
import {BBox} from "core/util/bbox"
import {logger} from "core/logging"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import type * as p from "core/properties"

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
      } else if (target instanceof Node) {
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

  protected _html: HTMLView | null = null

  override *children(): IterViews {
    yield* super.children()
    if (this._html != null) {
      yield this._html
    }
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {content} = this.model
    if (content instanceof HTML) {
      this._html = await build_view(content, {parent: this})
    }

    this.render()
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
    })
    this.on_change([content, closable, interactive], () => this.render())
    this.on_change([position, attachment, visible], () => this._reposition())
  }

  override disconnect_signals(): void {
    if (this._scroll_listener != null) {
      document.removeEventListener("scroll", this._scroll_listener, {capture: true})
      delete this._scroll_listener
    }
    super.disconnect_signals()
  }

  override remove(): void {
    this._html?.remove()
    this._observer.disconnect()
    super.remove()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), tooltips_css, icons_css]
  }

  get content(): Node {
    const {content} = this.model
    if (isString(content)) {
      return document.createTextNode(content)
    } else if (content instanceof HTML) {
      assert(this._html != null)
      return this._html.el
    } else {
      return content
    }
  }

  override render(): void {
    super.render()

    this._html?.render()
    this.arrow_el = div({class: [tooltips.arrow]})
    this.content_el = div({class: tooltips.tooltip_content}, this.content)
    this.shadow_el.append(this.arrow_el, this.content_el)

    if (this.model.closable) {
      const close_el = div({class: tooltips.close})
      close_el.addEventListener("click", () => {
        this.model.visible = false
      })
      this.shadow_el.appendChild(close_el)
    }

    this.el.classList.toggle(tooltips.show_arrow, this.model.show_arrow)
    this.el.classList.toggle(tooltips.non_interactive, !this.model.interactive)

    this._reposition()
  }

  private _anchor_to_align(anchor: Anchor): [VAlign, HAlign] {
    switch (anchor) {
      case "top_left":
        return ["top", "left"]
      case "top":
      case "top_center":
        return ["top", "center"]
      case "top_right":
        return ["top", "right"]

      case "left":
      case "center_left":
        return ["center", "left"]
      case "center":
      case "center_center":
        return ["center", "center"]
      case "right":
      case "center_right":
        return ["center", "right"]

      case "bottom_left":
        return ["bottom", "left"]
      case "bottom":
      case "bottom_center":
        return ["bottom", "center"]
      case "bottom_right":
        return ["bottom", "right"]
    }
  }

  protected _reposition(): void {
    const {position, visible} = this.model
    if (position == null || !visible) {
      this.el.remove()
      return
    }

    // Append to `body` to deal with CSS' `contain` interaction
    // with `position: fixed`. We assume initial containment
    // block in this function, but `contain` can introduce a
    // new containment block and offset tooltip's position.
    (document.body.shadowRoot ?? document.body).append(this.el)

    const bbox = bounding_box(this.target)

    const [sx, sy] = (() => {
      if (isString(position)) {
        const [valign, halign] = this._anchor_to_align(position)
        const sx = (() => {
          switch (halign) {
            case "left": return bbox.left
            case "center": return bbox.hcenter
            case "right": return bbox.right
          }
        })()
        const sy = (() => {
          switch (valign) {
            case "top": return bbox.top
            case "center": return bbox.vcenter
            case "bottom": return bbox.bottom
          }
        })()
        return [sx, sy]
      } else {
        const [x, y] = position
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
            const [valign, halign] = this._anchor_to_align(position)
            if (halign != "center") {
              return halign == "left" ? "left" : "right"
            }
            if (valign != "center") {
              return valign == "top" ? "above" : "below"
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
    target: p.Property<UIElement | Selector | Node | "auto">
    position: p.Property<Anchor | [number, number] | null>
    content: p.Property<string | HTML | Node>
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

    this.define<Tooltip.Props>(({Boolean, Number, String, Tuple, Or, Ref, Nullable, Auto}) => ({
      target: [ Or(Ref(UIElement), Ref(Selector), Ref(Node), Auto), "auto" ],
      position: [ Nullable(Or(Anchor, Tuple(Number, Number))), null ],
      content: [ Or(String, Ref(HTML), Ref(Node)) ],
      attachment: [ Or(TooltipAttachment, Auto), "auto" ],
      show_arrow: [ Boolean, true ],
      closable: [ Boolean, false ],
      interactive: [ Boolean, true ],
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
