import {Annotation, AnnotationView} from "./annotation"
import {VerticalAlign, TextAlign} from "core/enums"
import type {Size, Layoutable} from "core/layout"
import type * as p from "core/properties"
import type {LRTB, Corners} from "core/util/bbox"
import type * as visuals from "core/visuals"
import * as resolve from "../common/resolve"
import * as mixins from "core/property_mixins"
import {Padding, BorderRadius} from "../common/kinds"
import type {Context2d} from "core/util/canvas"
import type {StyleSheetLike} from "core/dom"
import {div} from "core/dom"
import * as title_css from "styles/title.css"
import {SideLayout} from "core/layout/side_panel"
import {BaseText} from "models/text/base_text"
import {isString} from "core/util/types"
import {parse_delimited_string} from "models/text/utils"

export class TitleView extends AnnotationView {
  declare model: Title
  declare visuals: Title.Visuals
  declare layout: Layoutable

  protected _resize_observer: ResizeObserver

  override initialize(): void {
    super.initialize()
    this._resize_observer = new ResizeObserver((_entries) => this.request_layout())
    this._resize_observer.observe(this.el, {box: "border-box"})
  }

  override get is_dual_renderer(): boolean {
    return true
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), title_css.default]
  }

  override render(): void {
    super.render()

    const {text} = this.model
    const label = isString(text) ? parse_delimited_string(text) : text

    const label_el = div({class: title_css.label}, label.text) // TODO math text
    this.shadow_el.append(label_el)
  }

  override update_layout(): void {
    this.layout = new SideLayout(this.panel!, () => this.get_size())
    this._apply_visuals(this.layer.ctx)
  }

  protected _paint(_ctx: Context2d): void {
  }

  override update_position(): void {
  }

  protected override _get_size(): Size {
    const {width, height} = this.el.getBoundingClientRect()
    return {width, height}
  }

  get angle(): number {
    return this.panel!.get_label_angle_heuristic("parallel")
  }

  get padding(): LRTB<number> {
    return resolve.padding(this.model.padding)
  }

  get border_radius(): Corners<number> {
    return resolve.border_radius(this.model.border_radius)
  }

  protected _apply_visuals(ctx: Context2d): void {
    this.visuals.text.set_value(ctx)

    this.style.replace(`
    :host {
      color: ${ctx.fillStyle};
      -webkit-text-stroke: 1px ${ctx.strokeStyle};
      font: ${ctx.font};
    }
    `)

    const justify_content = (() => {
      switch (this.model.align) {
        case "left": return "flex-start"
        case "center": return "center"
        case "right": return "flex-end"
      }
    })()

    const align_items = (() => {
      switch (this.model.vertical_align) {
        case "top": return "flex-start"
        case "middle": return "center"
        case "bottom": return "flex-end"
      }
    })()

    this.style.append(`
    :host {
      justify-self: ${justify_content};
      align-self: ${align_items};
    }
    `)

    /*
    const {writing_mode, rotate} = (() => {
      switch (this.panel!.face_adjusted_side) {
        case "above": return {writing_mode: "horizontal-tb", rotate: 0}
        case "below": return {writing_mode: "horizontal-tb", rotate: 0}
        case "left":  return {writing_mode: "vertical-rl",   rotate: 180}
        case "right": return {writing_mode: "vertical-rl",   rotate: 0}
      }
    })()
    */

    const {angle} = this
    if (angle != 0) {
      // TODO this doesn't consider `align`
      this.style.append(`
      :host {
        writing-mode: vertical-rl;
        rotate: 180deg;
        align-self: end;
      }
      `)
    }

    const margin = (() => {
      const hmargin = this.model.offset
      const vmargin = this.model.standoff/2

      // TODO this isn't fully backwards compatible
      switch (this.panel!.face_adjusted_side) {
        case "above":
        case "below": return {left: hmargin, right: hmargin, top: vmargin, bottom: vmargin}
        case "left":  return {left: vmargin, right: vmargin, top: hmargin, bottom: hmargin}
        case "right": return {left: vmargin, right: vmargin, top: hmargin, bottom: hmargin}
      }
    })()
    this.style.append(`
    :host {
      padding-left: ${margin.left}px;
      padding-right: ${margin.right}px;
      padding-top: ${margin.top}px;
      padding-bottom: ${margin.bottom}px;
    }
    `)

    const {padding} = this
    this.style.append(`
    .${title_css.label} {
      padding-left: ${padding.left}px;
      padding-right: ${padding.right}px;
      padding-top: ${padding.top}px;
      padding-bottom: ${padding.bottom}px;
    }
    `)

    const {border_radius} = this
    this.style.append(`
    .${title_css.label} {
      border-top-left-radius: ${border_radius.top_left}px;
      border-top-right-radius: ${border_radius.top_right}px;
      border-bottom-right-radius: ${border_radius.bottom_right}px;
      border-bottom-left-radius: ${border_radius.bottom_left}px;
    }
    `)

    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_value(ctx)
      this.style.append(`
      .${title_css.label} {
        background-color: ${ctx.fillStyle};
      }
      `)
    }

    if (this.visuals.border_line.doit) {
      // attempt to support vector-style ("8 4 8") line dashing for css mode
      this.visuals.border_line.set_value(ctx)
      this.style.append(`
      .${title_css.label} {
        border-style: ${ctx.getLineDash().length < 2 ? "solid" : "dashed"};
        border-width: ${ctx.lineWidth}px;
        border-color: ${ctx.strokeStyle};
      }
      `)
    }
  }
}

export namespace Title {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    text: p.Property<string | BaseText>
    padding: p.Property<Padding>
    border_radius: p.Property<BorderRadius>
    vertical_align: p.Property<VerticalAlign>
    align: p.Property<TextAlign>
    offset: p.Property<number>
    standoff: p.Property<number>
  } & Mixins

  export type Mixins =
    mixins.Text &
    mixins.BorderLine &
    mixins.BackgroundFill &
    mixins.BackgroundHatch

  export type Visuals = Annotation.Visuals & {
    text: visuals.Text
    border_line: visuals.Line
    background_fill: visuals.Fill
    background_hatch: visuals.Hatch
  }
}

export interface Title extends Title.Attrs {}

export class Title extends Annotation {
  declare properties: Title.Props
  declare __view_type__: TitleView

  constructor(attrs?: Partial<Title.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TitleView

    this.mixins<Title.Mixins>([
      mixins.Text,
      ["border_",     mixins.Line],
      ["background_", mixins.Fill],
      ["background_", mixins.Hatch],
    ])

    this.define<Title.Props>(({Str, Or, Ref, Float}) => ({
      text:           [ Or(Str, Ref(BaseText)), "" ],
      padding:        [ Padding, 0 ],
      border_radius:  [ BorderRadius, 0 ],
      vertical_align: [ VerticalAlign, "bottom" ],
      align:          [ TextAlign, "left" ],
      offset:         [ Float, 0 ],
      standoff:       [ Float, 10 ],
    }))

    this.override<Title.Props>({
      border_line_color: null,
      background_fill_color: null,
      text_font_size: "13px",
      text_font_style: "bold",
      text_line_height: 1.0,
    })
  }
}
