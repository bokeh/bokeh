import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {FontStyle, VerticalAlign, TextAlign, TextBaseline} from "core/enums"
import {Size} from "core/layout"
import {Text} from "core/visuals"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"

export class TitleView extends TextAnnotationView {
  model: Title
  visuals: Title.Visuals

  initialize(): void {
    super.initialize()
    this.visuals.text = new Text(this.model)
  }

  protected _get_location(): [number, number] {
    const panel = this.panel!

    const hmargin = this.model.offset
    const vmargin = 5

    let sx: number, sy: number
    const {bbox} = panel
    switch (panel.side) {
      case 'above':
      case 'below': {
        switch (this.model.vertical_align) {
          case 'top':    sy = bbox.top     + vmargin; break
          case 'middle': sy = bbox.vcenter;           break
          case 'bottom': sy = bbox.bottom  - vmargin; break
        }

        switch (this.model.align) {
          case 'left':   sx = bbox.left    + hmargin; break
          case 'center': sx = bbox.hcenter;           break
          case 'right':  sx = bbox.right   - hmargin; break
        }
        break
      }
      case 'left': {
        switch (this.model.vertical_align) {
          case 'top':    sx = bbox.left    - vmargin; break
          case 'middle': sx = bbox.hcenter;           break
          case 'bottom': sx = bbox.right   + vmargin; break
        }

        switch (this.model.align) {
          case 'left':   sy = bbox.bottom  - hmargin; break
          case 'center': sy = bbox.vcenter;           break
          case 'right':  sy = bbox.top     + hmargin; break
        }
        break
      }
      case 'right': {
        switch (this.model.vertical_align) {
          case 'top':    sx = bbox.right   - vmargin; break
          case 'middle': sx = bbox.hcenter;           break
          case 'bottom': sx = bbox.left    + vmargin; break
        }

        switch (this.model.align) {
          case 'left':   sy = bbox.top     + hmargin; break
          case 'center': sy = bbox.vcenter;           break
          case 'right':  sy = bbox.bottom  - hmargin; break
        }
        break
      }
    }

    return [sx, sy]
  }

  protected _render(): void {
    const {text} = this.model
    if (text == null || text.length == 0)
      return

    this.model.text_baseline = this.model.vertical_align
    this.model.text_align = this.model.align

    const [sx, sy] = this._get_location()
    const angle = this.panel!.get_label_angle_heuristic('parallel')

    const draw = this.model.render_mode == 'canvas' ? this._canvas_text.bind(this) : this._css_text.bind(this)
    draw(this.layer.ctx, text, sx, sy, angle)
  }

  protected _get_size(): Size {
    const {text} = this.model
    if (text == null || text.length == 0)
      return {width: 0, height: 0}
    else {
      this.visuals.text.set_value(this.layer.ctx)
      const {width, ascent} = this.layer.ctx.measureText(text)
      return {width, height: ascent * this.visuals.text.text_line_height.value() + 10}
    }
  }
}

export namespace Title {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextAnnotation.Props & {
    text: p.Property<string>
    text_font: p.Property<string> // XXX: Font
    text_font_size: p.StringSpec
    text_font_style: p.Property<FontStyle>
    text_color: p.ColorSpec
    text_alpha: p.NumberSpec
    text_line_height: p.NumberSpec
    vertical_align: p.Property<VerticalAlign>
    align: p.Property<TextAlign>
    offset: p.Property<number>
    text_align: p.Property<TextAlign>
    text_baseline: p.Property<TextBaseline>
  } & Mixins

  export type Mixins =
    mixins.BorderLine     &
    mixins.BackgroundFill

  export type Visuals = TextAnnotation.Visuals
}

export interface Title extends Title.Attrs {}

export class Title extends TextAnnotation {
  properties: Title.Props
  __view_type__: TitleView

  constructor(attrs?: Partial<Title.Attrs>) {
    super(attrs)
  }

  static init_Title(): void {
    this.prototype.default_view = TitleView

    this.mixins<Title.Mixins>([
      ["border_",     mixins.Line],
      ["background_", mixins.Fill],
    ])

    this.define<Title.Props>({
      text:             [ p.String                     ],
      text_font:        [ p.Font,          'helvetica' ],
      text_font_size:   [ p.StringSpec,    '13px'      ],
      text_font_style:  [ p.FontStyle,     'bold'      ],
      text_color:       [ p.ColorSpec,     '#444444'   ],
      text_alpha:       [ p.NumberSpec,    1.0         ],
      text_line_height: [ p.Number,        1.0         ],
      vertical_align:   [ p.VerticalAlign, 'bottom'    ],
      align:            [ p.TextAlign,     'left'      ],
      offset:           [ p.Number,        0           ],
    })

    this.override({
      background_fill_color: null,
      border_line_color: null,
    })

    this.internal({
      text_align:    [ p.TextAlign,    'left'   ],
      text_baseline: [ p.TextBaseline, 'bottom' ],
    })
  }
}
