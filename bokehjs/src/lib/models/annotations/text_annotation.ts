import {Annotation, AnnotationView} from "./annotation"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import {SideLayout} from "core/layout/side_panel"
import type {BaseTextView} from "models/text/base_text"
import {BaseText} from "models/text/base_text"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import type {GraphicsBox} from "core/graphics"
import {isString} from "core/util/types"
import {parse_delimited_string} from "models/text/utils"
import {Padding, BorderRadius} from "../common/kinds"
import * as resolve from "../common/resolve"
import {BBox} from "core/util/bbox"
import type {LRTB, XY, SXY, Corners} from "core/util/bbox"
import type {Size} from "core/layout"
import {round_rect} from "../common/painting"
import * as mixins from "core/property_mixins"

export abstract class TextAnnotationView extends AnnotationView {
  declare model: TextAnnotation
  declare visuals: TextAnnotation.Visuals

  protected _text_view: BaseTextView

  override *children(): IterViews {
    yield* super.children()
    yield this._text_view
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._init_text()
  }

  protected async _init_text(): Promise<void> {
    const {text} = this.model
    const _text = isString(text) ? parse_delimited_string(text) : text
    this._text_view = await build_view(_text, {parent: this})
  }

  override update_layout(): void {
    const {panel} = this
    if (panel != null)
      this.layout = new SideLayout(panel, () => this.get_size(), false)
    else
      this.layout = undefined
  }

  override connect_signals(): void {
    super.connect_signals()

    const {text} = this.model.properties
    this.on_change(text, async () => {
      this._text_view.remove()
      await this._init_text()
    })

    this.connect(this.model.change, () => this.request_render())
  }

  override remove(): void {
    this._text_view.remove()
    super.remove()
  }

  override has_finished(): boolean {
    if (!super.has_finished())
      return false

    if (!this._text_view.has_finished())
      return false

    return true
  }

  override get displayed(): boolean {
    return super.displayed && this._text_view.model.text != "" && this.visuals.text.doit
  }

  abstract get anchor(): XY<number>

  abstract get origin(): SXY

  abstract get angle(): number

  get padding(): LRTB<number> {
    return resolve.padding(this.model.padding)
  }

  get border_radius(): Corners<number> {
    return resolve.border_radius(this.model.border_radius)
  }

  protected _text_box: GraphicsBox
  protected _rect: {
    sx: number
    sy: number
    width: number
    height: number
    angle: number
    anchor: XY<number>
    padding: LRTB<number>
    border_radius: Corners<number>
  }

  protected override _get_size(): Size {
    if (!this.displayed) {
      return {width: 0, height: 0}
    }

    const graphics = this._text_view.graphics()
    graphics.angle = this.angle
    graphics.align = "auto"
    graphics.visuals = this.visuals.text.values()

    const size = graphics.size()
    const {padding} = this

    const width = size.width + padding.left + padding.right
    const height = size.height + padding.top + padding.bottom

    return {width, height}
  }

  override compute_geometry(): void {
    super.compute_geometry()

    const text_box = this._text_view.graphics()
    text_box.position = {sx: 0, sy: 0, x_anchor: "left", y_anchor: "top"}
    text_box.angle = 0 // needs reset because text_box is self-referential
    text_box.align = "auto"
    text_box.visuals = this.visuals.text.values()

    const size = text_box.size()
    const {sx, sy} = this.origin
    const {anchor, padding, border_radius, angle} = this

    const width = size.width + padding.left + padding.right
    const height = size.height + padding.top + padding.bottom

    this._text_box = text_box
    this._rect = {sx, sy, width, height, angle, anchor, padding, border_radius}
  }

  protected _render(): void {
    this.compute_geometry() // TODO: remove this

    const {ctx} = this.layer

    const {sx, sy, width, height, angle, anchor, padding, border_radius} = this._rect
    const label = this._text_box

    const dx = anchor.x*width
    const dy = anchor.y*height

    ctx.translate(sx, sy)
    ctx.rotate(angle)
    ctx.translate(-dx, -dy)

    const {background_fill, background_hatch, border_line, text} = this.visuals
    if (background_fill.doit || background_hatch.doit || border_line.doit) {
      ctx.beginPath()
      const bbox = new BBox({x: 0, y: 0, width, height})
      round_rect(ctx, bbox, border_radius)
      background_fill.apply(ctx)
      background_hatch.apply(ctx)
      border_line.apply(ctx)
    }

    if (text.doit) {
      const {left, top} = padding
      ctx.translate(left, top)
      label.paint(ctx)
      ctx.translate(-left, -top)
    }

    ctx.translate(dx, dy)
    ctx.rotate(-angle)
    ctx.translate(-sx, -sy)
  }
}

export namespace TextAnnotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    text: p.Property<string | BaseText>
    padding: p.Property<Padding>
    border_radius: p.Property<BorderRadius>
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

export interface TextAnnotation extends TextAnnotation.Attrs {}

export abstract class TextAnnotation extends Annotation {
  declare properties: TextAnnotation.Props
  declare __view_type__: TextAnnotationView

  constructor(attrs?: Partial<TextAnnotation.Attrs>) {
    super(attrs)
  }

  static {
    this.mixins<TextAnnotation.Mixins>([
      mixins.Text,
      ["border_",     mixins.Line],
      ["background_", mixins.Fill],
      ["background_", mixins.Hatch],
    ])

    this.define<TextAnnotation.Props>(({String, Or, Ref}) => ({
      text: [ Or(String, Ref(BaseText)), "" ],
      padding: [ Padding, 0 ],
      border_radius: [ BorderRadius, 0 ],
    }))

    this.override<TextAnnotation.Props>({
      border_line_color: null,
      background_fill_color: null,
      background_hatch_color: null,
    })
  }
}
