import {Annotation, AnnotationView} from "./annotation"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {SideLayout} from "core/layout/side_panel"
import {Context2d} from "core/util/canvas"
import {BaseText, BaseTextView} from "models/text/base_text"
import {build_view} from "core/build_views"
import {isString} from "core/util/types"
import {parse_delimited_string} from "models/text/utils"
import {Position} from "core/graphics"
import * as mixins from "core/property_mixins"

export abstract class TextAnnotationView extends AnnotationView {
  override model: TextAnnotation
  override visuals: TextAnnotation.Visuals

  protected _text_view: BaseTextView

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
      this.layout = new SideLayout(panel, () => this.get_size(), true)
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

  protected _paint(ctx: Context2d, position: Position, angle: number): void {
    const graphics = this._text_view.graphics()
    graphics.angle = angle
    graphics.position = position
    graphics.align = "auto"
    graphics.visuals = this.visuals.text.values()

    const {background_fill, border_line} = this.visuals
    if (background_fill.doit || border_line.doit) {
      const {p0, p1, p2, p3} = graphics.rect()
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.lineTo(p3.x, p3.y)
      ctx.closePath()

      this.visuals.background_fill.apply(ctx)
      this.visuals.border_line.apply(ctx)
    }

    if (this.visuals.text.doit)
      graphics.paint(ctx)
  }
}

export namespace TextAnnotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    text: p.Property<string | BaseText>
  } & Mixins

  export type Mixins =
    mixins.Text &
    mixins.BorderLine &
    mixins.BackgroundFill

  export type Visuals = Annotation.Visuals & {
    text: visuals.Text
    border_line: visuals.Line
    background_fill: visuals.Fill
  }
}

export interface TextAnnotation extends TextAnnotation.Attrs {}

export abstract class TextAnnotation extends Annotation {
  override properties: TextAnnotation.Props
  override __view_type__: TextAnnotationView

  constructor(attrs?: Partial<TextAnnotation.Attrs>) {
    super(attrs)
  }

  static {
    this.mixins<TextAnnotation.Mixins>([
      mixins.Text,
      ["border_",     mixins.Line],
      ["background_", mixins.Fill],
    ])

    this.define<TextAnnotation.Props>(({String, Or, Ref}) => ({
      text: [ Or(String, Ref(BaseText)), "" ],
    }))

    this.override<TextAnnotation.Props>({
      background_fill_color: null,
      border_line_color: null,
    })
  }
}
