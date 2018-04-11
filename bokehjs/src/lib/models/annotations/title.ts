import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {FontSizeSpec, ColorSpec, NumberSpec} from "core/vectorization"
import {Color} from "core/types"
import {LineJoin, LineCap} from "core/enums"
import {FontStyle, VerticalAlign, TextAlign, TextBaseline} from "core/enums"
import {hide} from "core/dom"
import * as p from "core/properties"
import {Text} from "core/visuals"

export class TitleView extends TextAnnotationView {
  model: Title
  visuals: Title.Visuals

  initialize(options: any): void {
    super.initialize(options)
    this.visuals.text = new Text(this.model)
  }

  protected _get_location(): [number, number] {
    const panel = this.model.panel!

    const hmargin = this.model.offset
    const vmargin = 5

    let sx: number, sy: number
    switch (panel.side) {
      case 'above':
      case 'below': {
        switch (this.model.vertical_align) {
          case 'top':    sy = panel._top.value     + vmargin; break
          case 'middle': sy = panel._vcenter.value;           break
          case 'bottom': sy = panel._bottom.value  - vmargin; break
          default: throw new Error("unreachable code")
        }

        switch (this.model.align) {
          case 'left':   sx = panel._left.value    + hmargin; break
          case 'center': sx = panel._hcenter.value;           break
          case 'right':  sx = panel._right.value   - hmargin; break
          default: throw new Error("unreachable code")
        }
        break
      }
      case 'left': {
        switch (this.model.vertical_align) {
          case 'top':    sx = panel._left.value    - vmargin; break
          case 'middle': sx = panel._hcenter.value;           break
          case 'bottom': sx = panel._right.value   + vmargin; break
          default: throw new Error("unreachable code")
        }

        switch (this.model.align) {
          case 'left':   sy = panel._bottom.value  - hmargin; break
          case 'center': sy = panel._vcenter.value;           break
          case 'right':  sy = panel._top.value     + hmargin; break
          default: throw new Error("unreachable code")
        }
        break
      }
      case 'right': {
        switch (this.model.vertical_align) {
          case 'top':    sx = panel._right.value   - vmargin; break
          case 'middle': sx = panel._hcenter.value;           break
          case 'bottom': sx = panel._left.value    + vmargin; break
          default: throw new Error("unreachable code")
        }

        switch (this.model.align) {
          case 'left':   sy = panel._top.value     + hmargin; break
          case 'center': sy = panel._vcenter.value;           break
          case 'right':  sy = panel._bottom.value  - hmargin; break
          default: throw new Error("unreachable code")
        }
        break
      }
      default: throw new Error("unreachable code")
    }

    return [sx, sy]
  }

  render(): void {
    if (!this.model.visible) {
      if (this.model.render_mode == 'css')
        hide(this.el)
      return
    }

    const {text} = this.model
    if (text == null || text.length == 0)
      return

    this.model.text_baseline = this.model.vertical_align
    this.model.text_align = this.model.align

    const [sx, sy] = this._get_location()
    const angle = this.model.panel!.get_label_angle_heuristic('parallel')

    const draw = this.model.render_mode == 'canvas' ? this._canvas_text.bind(this) : this._css_text.bind(this)
    draw(this.plot_view.canvas_view.ctx, text, sx, sy, angle)
  }

  protected _get_size(): number {
    const {text} = this.model
    if (text == null || text.length == 0)
      return 0
    else {
      const {ctx} = this.plot_view.canvas_view
      this.visuals.text.set_value(ctx)
      return ctx.measureText(text).ascent + 10
    }
  }
}

export namespace Title {
  // line:border_
  export interface BorderLine {
    border_line_color: Color
    border_line_width: number
    border_line_alpha: number
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: number[]
    border_line_dash_offset: number
  }

  // fill:background_
  export interface BackgroundFill {
    background_fill_color: Color
    background_fill_alpha: number
  }

  export interface Mixins extends BorderLine, BackgroundFill {}

  export interface Attrs extends TextAnnotation.Attrs, Mixins {
    text: string
    text_font: string // XXX: Font
    text_font_size: FontSizeSpec
    text_font_style: FontStyle
    text_color: ColorSpec
    text_alpha: NumberSpec
    vertical_align: VerticalAlign
    align: TextAlign
    offset: number
    text_align: TextAlign
    text_baseline: TextBaseline
  }

  export interface Props extends TextAnnotation.Props {}

  export type Visuals = TextAnnotation.Visuals
}

export interface Title extends Title.Attrs {}

export class Title extends TextAnnotation {

  properties: Title.Props

  constructor(attrs?: Partial<Title.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Title'
    this.prototype.default_view = TitleView

    this.mixins(['line:border_', 'fill:background_'])

    this.define({
      text:            [ p.String,                    ],
      text_font:       [ p.Font,          'helvetica' ],
      text_font_size:  [ p.FontSizeSpec,  '10pt'      ],
      text_font_style: [ p.FontStyle,     'bold'      ],
      text_color:      [ p.ColorSpec,     '#444444'   ],
      text_alpha:      [ p.NumberSpec,    1.0         ],
      vertical_align:  [ p.VerticalAlign, 'bottom'    ],
      align:           [ p.TextAlign,     'left'      ],
      offset:          [ p.Number,        0           ],
    })

    this.override({
      background_fill_color: null,
      border_line_color: null,
    })

    this.internal({
      text_align:    [ p.TextAlign,    'left'  ],
      text_baseline: [ p.TextBaseline, 'bottom' ],
    })
  }
}
Title.initClass()
