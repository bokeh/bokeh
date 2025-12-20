import {Annotation, AnnotationView} from "./annotation"
import {VerticalAlign, TextAlign} from "core/enums"
import type {Size, Layoutable} from "core/layout"
import type * as p from "core/properties"
import type {LRTB, Corners, BBox} from "core/util/bbox"
import type * as visuals from "core/visuals"
import * as resolve from "../common/resolve"
import * as mixins from "core/property_mixins"
import {Padding, BorderRadius} from "../common/kinds"
import type {Context2d} from "core/util/canvas"
import type {StyleSheetLike} from "core/dom"
import {div, bounding_box, extents} from "core/dom"
import * as title_css from "styles/title.css"
import {SideLayout} from "core/layout/side_panel"
import {isString} from "core/util/types"
import {parse_delimited_string} from "models/text/utils"
import type {View} from "core/build_views"
import type {BaseTextView} from "models/text/base_text"
import {BaseText} from "models/text/base_text"
import {build_view} from "core/build_views"
import {round_rect} from "../common/painting"

export class TitleView extends AnnotationView {
  declare model: Title
  declare visuals: Title.Visuals
  declare layout: Layoutable

  protected _resize_observer: ResizeObserver
  protected label_el: HTMLElement

  override initialize(): void {
    super.initialize()
    this._resize_observer = new ResizeObserver(() => this.request_layout())
    this._resize_observer.observe(this.el, {box: "border-box"})
  }

  protected _text_view: BaseTextView

  override children_views(): View[] {
    return [...super.children_views(), this._text_view]
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._init_text()
  }

  override has_finished(): boolean {
    return super.has_finished() && this._text_view.has_finished()
  }

  override remove(): void {
    this._resize_observer.disconnect()
    this._text_view.remove()
    super.remove()
  }

  protected async _init_text(): Promise<void> {
    const {text} = this.model
    const _text = isString(text) ? parse_delimited_string(text) : text
    this._text_view = await build_view(_text, {parent: this})
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), title_css.default]
  }

  override render(): void {
    super.render()

    this.label_el = div({class: title_css.label}, this._text_view.html())
    this.shadow_el.append(this.label_el)
  }

  override update_layout(): void {
    this.layout = new SideLayout(this.panel!, () => this.get_size())
    this._apply_visuals()
  }

  protected _paint(ctx: Context2d): void {
    const do_paint = this.parent.is_forcing_paint
    this.label_el.style.visibility = do_paint ? "hidden" : ""

    if (!do_paint) {
      this._text_view.mark_finished()
      return
    }

    if (this._text_view.is_empty) {
      return
    }

    const canvas_bbox = bounding_box(this.plot_view.canvas.el)
    this._paint_box(ctx, canvas_bbox)
    this._paint_title(ctx, canvas_bbox)
  }

  protected _paint_box(ctx: Context2d, canvas_bbox: BBox): void {
    const {background_fill, background_hatch, border_line} = this.visuals
    if (!(background_fill.doit || background_hatch.doit || border_line.doit)) {
      return
    }

    ctx.beginPath()
    const bbox = bounding_box(this.label_el).relative_to(canvas_bbox)
    round_rect(ctx, bbox, this.border_radius)

    background_fill.apply(ctx)
    background_hatch.apply(ctx)
    border_line.apply(ctx)
  }

  protected _paint_title(ctx: Context2d, canvas_bbox: BBox): void {
    if (!this.visuals.text.doit) {
      return
    }

    const text_box = this._text_view.graphics()
    const text_bbox = bounding_box(this.label_el).relative_to(canvas_bbox)

    let {x: sx, y: sy} = text_bbox
    const {padding, border} = extents(this.label_el)

    switch (this.panel!.face_adjusted_side) {
      case "above":
      case "below": {
        sx += padding.left + border.left
        sy += padding.top + border.top
        break
      }
      case "left": {
        sx += padding.left + border.left
        sy += text_bbox.height - padding.bottom - border.bottom
        break
      }
      case "right": {
        sx += text_bbox.width - padding.right - border.right
        sy += padding.top + border.top
        break
      }
      default:
    }

    text_box.position = {sx, sy, x_anchor: "left", y_anchor: "top"}
    text_box.visuals = this.visuals.text.values()
    text_box.angle = this.panel!.get_label_angle_heuristic("parallel")
    text_box.paint(ctx)
  }

  override update_position(): void {
    // do nothing and remove at some point
  }

  protected override _get_size(): Size {
    const {width, height} = this.el.getBoundingClientRect()
    return {width, height}
  }

  get padding(): LRTB<number> {
    return resolve.padding(this.model.padding)
  }

  get border_radius(): Corners<number> {
    return resolve.border_radius(this.model.border_radius)
  }

  protected _apply_visuals(): void {
    const text_styles = this.visuals.text.computed_values()
    this.style.append(`
    :host {
      font: ${text_styles.font};
      color: ${text_styles.color};
      -webkit-text-stroke: ${text_styles.outline_width}px ${text_styles.outline_color};
    }
    `)

    // can't simply use `rotate`, because rotation doesn't affect layout
    const {writing_mode, rotate} = (() => {
      switch (this.panel!.face_adjusted_side) {
        case "above": return {writing_mode: "horizontal-tb", rotate: 0}
        case "below": return {writing_mode: "horizontal-tb", rotate: 0}
        case "left":  return {writing_mode: "vertical-rl",   rotate: 180}
        case "right": return {writing_mode: "vertical-rl",   rotate: 0}
      }
    })()
    this.style.append(`
    :host {
      writing-mode: ${writing_mode};
      rotate: ${rotate}deg;
    }
    `)

    const justify_self = (() => {
      switch (this.model.align) {
        case "left":   return "flex-start"
        case "center": return "center"
        case "right":  return "flex-end"
      }
    })()

    const align_self = (() => {
      switch (this.model.vertical_align) {
        case "top":    return "flex-start"
        case "middle": return "center"
        case "bottom": return "flex-end"
      }
    })()
    this.style.append(`
    :host {
      justify-self: ${justify_self};
      align-self: ${align_self};
    }
    `)

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
      const {color} = this.visuals.background_fill.computed_values()
      this.style.append(`
      .${title_css.label} {
        background-color: ${color};
      }
      `)
    }

    // TODO background_hatch (https://github.com/bokeh/bokeh/issues/14312)

    if (this.visuals.border_line.doit) {
      // TODO use background-image to replicate number[] dash patterns
      const {color, width, dash} = this.visuals.border_line.computed_values()
      this.style.append(`
      .${title_css.label} {
        border-color: ${color};
        border-width: ${width}px;
        border-style: ${isString(dash) ? dash : (dash.length < 2 ? "solid" : "dashed")};
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
