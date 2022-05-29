import {UIElement, UIElementView} from "./ui_element"
import {Anchor, VAlign, HAlign, TooltipAttachment} from "core/enums"
import {div, bounding_box} from "core/dom"
import {DOMView} from "core/dom_view"
import {isString} from "core/util/types"
import * as p from "core/properties"

import tooltips_css, * as tooltips from "styles/tooltips.css"

const arrow_size = 10  // XXX: keep in sync with less

export class TooltipView extends UIElementView {
  override model: Tooltip
  override parent: DOMView

  protected content_el: HTMLElement
  protected _observer: ResizeObserver

  override connect_signals(): void {
    super.connect_signals()

    this._observer = new ResizeObserver(() => {
      this._reposition()
    })

    const {target, content, closable, interactive, position, attachment, visible} = this.model.properties
    this.on_change(target, () => {
      this._observer.disconnect()
      this._observer.observe(this.target)
      this.render()
    })
    this.on_change([content, closable, interactive], () => this.render())
    this.on_change([position, attachment, visible], () => this._reposition())
  }

  override remove(): void {
    this._observer.disconnect()
    super.remove()
  }

  override styles(): string[] {
    return [...super.styles(), tooltips_css]
  }

  get target(): Element {
    return this.model.target ?? (this.parent.el as any) // TODO: parent: DOMElementView from PR #11915
  }

  override render(): void {
    this.empty()

    const content = (() => {
      const {content} = this.model
      if (isString(content)) {
        const parser = new DOMParser()
        const document = parser.parseFromString(content, "text/html")
        return [...document.body.childNodes]
      } else
        return [content]
    })()

    this.content_el = div({class: tooltips.tooltip_content}, content)
    this.shadow_el.appendChild(this.content_el)

    if (this.model.closable) {
      const close_el = div({class: tooltips.close})
      close_el.addEventListener("click", () => {
        this.model.visible = false
      })
      this.shadow_el.appendChild(close_el)
    }

    this.el.classList.toggle(tooltips.tooltip_arrow, this.model.show_arrow)
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

    this.target.appendChild(this.el)

    const bbox = bounding_box(this.target).relative()
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
      } else
        return position
    })()

    const side = (() => {
      const attachment = (() => {
        const {attachment} = this.model
        if (attachment == "auto") {
          if (isString(position)) {
            const [valign, halign] = this._anchor_to_align(position)
            if (halign != "center")
              return halign == "left" ? "left" : "right"
            if (valign != "center")
              return valign == "top" ? "above" : "below"
          }
          return "horizontal"
        } else
          return attachment
      })()

      switch (attachment) {
        case "horizontal":
          return sx < bbox.hcenter ? "right" : "left"
        case "vertical":
          return sy < bbox.vcenter ? "below" : "above"
        default:
          return attachment
      }
    })()

    this.el.classList.remove(tooltips.right)
    this.el.classList.remove(tooltips.left)
    this.el.classList.remove(tooltips.above)
    this.el.classList.remove(tooltips.below)

    // slightly confusing: side "left" (for example) is relative to point that
    // is being annotated but CS class ".bk-left" is relative to the tooltip itself
    let top: number
    let left: number | null = null
    let right: number | null = null

    switch (side) {
      case "right":
        this.el.classList.add(tooltips.left)
        left = sx + (this.el.offsetWidth - this.el.clientWidth) + arrow_size
        top = sy - this.el.offsetHeight/2
        break
      case "left":
        this.el.classList.add(tooltips.right)
        right = (bbox.width - sx) + arrow_size
        top = sy - this.el.offsetHeight/2
        break
      case "below":
        this.el.classList.add(tooltips.above)
        top = sy + (this.el.offsetHeight - this.el.clientHeight) + arrow_size
        left = Math.round(sx - this.el.offsetWidth/2)
        break
      case "above":
        this.el.classList.add(tooltips.below)
        top = sy - this.el.offsetHeight - arrow_size
        left = Math.round(sx - this.el.offsetWidth/2)
        break
    }

    this.el.style.top = `${top}px`
    this.el.style.left = left != null ? `${left}px` : ""
    this.el.style.right = right != null ? `${right}px` : ""
  }
}

export namespace Tooltip {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    position: p.Property<Anchor | [number, number] | null>
    content: p.Property<string | Node>
    attachment: p.Property<TooltipAttachment | "auto">
    show_arrow: p.Property<boolean>
    closable: p.Property<boolean>
    interactive: p.Property<boolean>
    /** @internal */
    target: p.Property<Node | null>
  }
}

export interface Tooltip extends Tooltip.Attrs {}

export class Tooltip extends UIElement {
  override properties: Tooltip.Props
  override __view_type__: TooltipView

  constructor(attrs?: Partial<Tooltip.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TooltipView

    this.define<Tooltip.Props>(({Boolean, Number, String, Tuple, Or, Ref, Nullable, Auto}) => ({
      position: [ Nullable(Or(Anchor, Tuple(Number, Number))), null ],
      content: [ Or(String, Ref(Node)) ],
      attachment: [ Or(TooltipAttachment, Auto), "auto" ],
      show_arrow: [ Boolean, true ],
      closable: [ Boolean, false ],
      interactive: [ Boolean, true ],
    }))

    this.internal<Tooltip.Props>(({Ref, Nullable}) => ({
      target: [ Nullable(Ref(Node)), null ],
    }))

    this.override<Tooltip.Props>({
      visible: false,
    })
  }

  clear(): void {
    this.position = null
  }
}
