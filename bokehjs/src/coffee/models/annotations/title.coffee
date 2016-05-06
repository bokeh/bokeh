Label = require "./label"

class TitleView extends Label.View

  _get_panel_offset: () ->
    side = @model.panel.side
    x = @model.panel._left._value
    if side in ['left', 'right', 'below']
      y = @model.panel._bottom._value
    if side in ['above']
      y = @model.panel._top._value
    return {x: x, y: -y}

  _get_size: () ->
    size = super()
    # Give the title a bit of space
    return size * 1.2

class Title extends Label.Model
  default_view: TitleView
  type: 'Title'

  @override {
    x: 0
    y: 0
    x_units: 'screen'
    y_units: 'screen'
    text_baseline: 'top'
    text_font_style: 'bold'
    text_font_size: '14pt'
  }

module.exports =
  Model: Title
  View: TitleView
