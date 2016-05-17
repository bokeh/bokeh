_ = require "underscore"
Box = require "../layouts/box"
PlotCanvas = require "../plots/plot_canvas"
LayoutDOM = require "../layouts/layout_dom"

p = require "../../core/properties"

class PlotView extends Box.View
  className: "bk-plot-layout"

  render: () ->
    @$el.addClass(@mget('responsive'))
    @update_constraints()
    LayoutDOM.render_dom(@)

  update_constraints: () ->
    s = @model.document.solver()
    if @mget('responsive') == 'width'
      height = 0
      for own key, child_view of @child_views
        height += child_view.el.scrollHeight
      s.suggest_value(@model._height, height)
    if @mget('responsive') == 'fixed'
      s.suggest_value(@model._width, @mget('plot_width'))
      s.suggest_value(@model._height, @mget('plot_height'))


class Plot extends Box.Model
  type: 'Plot'
  default_view: PlotView

  initialize: (options) ->
    super(options)
    @_horizontal = false
    @toolbar.location = @toolbar_location
    plot_canvas_options = _.omit(options, ['plot_width', 'plot_height', 'toolbar_location'])
    @_plot_canvas = new PlotCanvas.Model(plot_canvas_options)
    @_plot_canvas.toolbar = @toolbar
    @_plot_canvas.width = @plot_width
    @_plot_canvas.height = @plot_height

  _doc_attached: () ->
    @_plot_canvas.attach_document(@document)

  get_layoutable_children: () ->
    toolbar_location = @toolbar_location
    if toolbar_location in ['left', 'right']
      @_horizontal = true

    # Define the layout children based on the toolbar_location

    # Default if toolbar_location is None
    children = [@_plot_canvas]

    if toolbar_location in ['above', 'left']
      # Toolbar is first
      children = [@get('toolbar'), @_plot_canvas]
    if toolbar_location in ['below', 'right']
      # Toolbar is second
      children = [@_plot_canvas, @get('toolbar')]

    return children

  plot_canvas: () ->
    @_plot_canvas

  @define {
      plot_width:        [ p.Number,   600                    ]
      plot_height:       [ p.Number,   600                    ]

      toolbar:           [ p.Instance ]
      toolbar_location:  [ p.Location, 'above'                ]
    }

  @override {
    responsive: 'fixed'
  }

  # Set all the PlotCanvas properties as internal.
  # This seems to be necessary so that everything can initialize.
  # Feels very clumsy, but I'm not sure how the properties system wants
  # to handle something like this situation.
  @mixins ['line:outline_', 'text:title_', 'fill:background_', 'fill:border_']
  @internal {
    title:             [ p.String ]
    title_standoff:    [ p.Number ]

    h_symmetry:        [ p.Bool ]
    v_symmetry:        [ p.Bool ]

    above:             [ p.Array ]
    below:             [ p.Array ]
    left:              [ p.Array ]
    right:             [ p.Array ]

    renderers:         [ p.Array ]

    x_range:           [ p.Instance ]
    extra_x_ranges:    [ p.Any ]
    y_range:           [ p.Instance ]
    extra_y_ranges:    [ p.Any ]

    x_mapper_type:     [ p.String ]
    y_mapper_type:     [ p.String ]

    tool_events:       [ p.Instance ]

    lod_factor:        [ p.Number ]
    lod_interval:      [ p.Number ]
    lod_threshold:     [ p.Number ]
    lod_timeout:       [ p.Number ]

    webgl:             [ p.Bool ]
    hidpi:             [ p.Bool ]

    min_border:        [ p.Number ]
    min_border_top:    [ p.Number ]
    min_border_left:   [ p.Number ]
    min_border_bottom: [ p.Number ]
    min_border_right:  [ p.Number ]
  }

module.exports =
  View: PlotView
  Model: Plot
