import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {hide} from "core/dom"
import * as p from "core/properties"
import * as Visuals from "core/visuals"

export class TitleView extends TextAnnotationView

  initialize: (options) ->
    super(options)
    @visuals.text = new Visuals.Text(@model)

  _get_location: () ->
    panel = @model.panel

    hmargin = @model.offset
    vmargin = 5

    switch panel.side
      when 'above', 'below'
        switch @model.vertical_align
          when 'top'    then sy = panel._top.value     + vmargin
          when 'middle' then sy = panel._vcenter.value
          when 'bottom' then sy = panel._bottom.value  - vmargin

        switch @model.align
          when 'left'   then sx = panel._left.value    + hmargin
          when 'center' then sx = panel._hcenter.value
          when 'right'  then sx = panel._right.value   - hmargin
      when 'left'
        switch @model.vertical_align
          when 'top'    then sx = panel._left.value    - vmargin
          when 'middle' then sx = panel._hcenter.value
          when 'bottom' then sx = panel._right.value   + vmargin

        switch @model.align
          when 'left'   then sy = panel._bottom.value  - hmargin
          when 'center' then sy = panel._vcenter.value
          when 'right'  then sy = panel._top.value     + hmargin
      when 'right'
        switch @model.vertical_align
          when 'top'    then sx = panel._right.value   - vmargin
          when 'middle' then sx = panel._hcenter.value
          when 'bottom' then sx = panel._left.value    + vmargin

        switch @model.align
          when 'left'   then sy = panel._top.value     + hmargin
          when 'center' then sy = panel._vcenter.value
          when 'right'  then sy = panel._bottom.value  - hmargin

    return [sx, sy]

  render: () ->
    if not @model.visible
      if @model.render_mode == 'css'
        hide(@el)
      return

    text = @model.text
    if not text? or text.length == 0
      return

    @model.text_baseline = @model.vertical_align
    @model.text_align = @model.align

    [sx, sy] = @_get_location()
    angle = @model.panel.get_label_angle_heuristic('parallel')

    draw = if @model.render_mode == 'canvas' then @_canvas_text.bind(@) else @_css_text.bind(@)
    draw(@plot_view.canvas_view.ctx, text, sx, sy, angle)

  _get_size: () ->
    text = @model.text
    if not text? or text.length == 0
      return 0
    else
      ctx = @plot_view.canvas_view.ctx
      @visuals.text.set_value(ctx)
      return ctx.measureText(text).ascent + 10

export class Title extends TextAnnotation
  default_view: TitleView

  type: 'Title'

  @mixins ['line:border_', 'fill:background_']

  @define {
    text:            [ p.String,                    ]
    text_font:       [ p.Font,          'helvetica' ]
    text_font_size:  [ p.FontSizeSpec,  '10pt'      ]
    text_font_style: [ p.FontStyle,     'bold'      ]
    text_color:      [ p.ColorSpec,     '#444444'   ]
    text_alpha:      [ p.NumberSpec,    1.0         ]
    vertical_align:  [ p.VerticalAlign, 'bottom'    ]
    align:           [ p.TextAlign,     'left'      ]
    offset:          [ p.Number,        0           ]
    render_mode:     [ p.RenderMode,    'canvas'    ]
  }

  @override {
    background_fill_color: null
    border_line_color: null
  }

  @internal {
    text_align:    [ p.TextAlign,    'left'  ]
    text_baseline: [ p.TextBaseline, 'bottom' ]
  }
