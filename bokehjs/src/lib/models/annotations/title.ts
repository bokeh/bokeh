import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {Color} from "core/types"
import {LineJoin, LineCap} from "core/enums"
import {FontStyle, VerticalAlign, TextAlign, TextBaseline} from "core/enums"
import {hide} from "core/dom"
import {Text} from "core/visuals"
import {Size} from "core/layout"
import * as p from "core/properties"

export class TitleView extends TextAnnotationView {
  model: Title
  visuals: Title.Visuals

  initialize(options: any): void {
    super.initialize(options)
    this.visuals.text = new Text(this.model)
  }

  protected _get_location(): [number, number] {
    const panel = this.panel!

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
    const angle = this.panel!.get_label_angle_heuristic('parallel')

    const draw = this.model.render_mode == 'canvas' ? this._canvas_text.bind(this) : this._css_text.bind(this)
    draw(this.plot_view.canvas_view.ctx, text, sx, sy, angle)
  }

  protected _get_size(): Size {
    const {text} = this.model
    if (text == null || text.length == 0)
      return {width: 0, height: 0}
    else {
      this.visuals.text.set_value(this.ctx)
      const {width, ascent} = this.ctx.measureText(text)
      return {width, height: ascent + 10}
    }
  }
}

export namespace Title {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextAnnotation.Props & {
    text: p.Property<string>
    text_font: p.Property<string> // XXX: Font
    text_font_size: p.FontSizeSpec
    text_font_style: p.Property<FontStyle>
    text_color: p.ColorSpec
    text_alpha: p.NumberSpec
    vertical_align: p.Property<VerticalAlign>
    align: p.Property<TextAlign>
    offset: p.Property<number>
    text_align: p.Property<TextAlign>
    text_baseline: p.Property<TextBaseline>

    // line:border_
    border_line_color: p.Property<Color>
    border_line_width: p.Property<number>
    border_line_alpha: p.Property<number>
    border_line_join: p.Property<LineJoin>
    border_line_cap: p.Property<LineCap>
    border_line_dash: p.Property<number[]>
    border_line_dash_offset: p.Property<number>

    // fill:background_
    background_fill_color: p.Property<Color>
    background_fill_alpha: p.Property<number>
  }

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
