_ = require "underscore"

ToolEvents = require "../../common/tool_events"

Box = require "../layouts/box"
PlotCanvas = require "../plots/plot_canvas"
LayoutDOM = require "../layouts/layout_dom"
Toolbar = require "../tools/toolbar"

p = require "../../core/properties"

MIN_BORDER = 50

class PlotView extends Box.View
  className: "bk-plot-layout"

  render: () ->
    @$el.addClass(@mget('responsive'))
    @update_constraints()
    left = @mget('dom_left')
    top = @mget('dom_top')

    # This is a hack - the 25 is half of the 50 that was subtracted from
    # doc_width when resizing in document. This means that the root is positioned
    # symetrically and the vertical scroll bar doesn't mess stuff up when it
    # kicks in.
    if @model._is_root == true
      left = left + 25
      top = top + 15

    @$el.css({
      position: 'absolute'
      left: left
      top: top
      width: @model._width._value
      height: @model._height._value
    })

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
    plot_canvas_options = _.omit(options, 'toolbar_location')
    @_plot_canvas = new PlotCanvas.Model(plot_canvas_options)
    @_plot_canvas.toolbar = @toolbar

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

  @override {
    responsive: 'fixed'
  }

  # Set all the PlotCanvas properties.
  # This seems to be necessary so that everything can initialize.
  # Feels very clumsy, but I'm not sure how the properties system wants
  # to handle something like this situation.
  @mixins ['line:outline_', 'text:title_', 'fill:background_', 'fill:border_']
  @define {
      plot_width:        [ p.Number,   600                    ]
      plot_height:       [ p.Number,   600                    ]
      title:             [ p.String,   ''                     ]
      title_standoff:    [ p.Number,   8                      ]

      h_symmetry:        [ p.Bool,     true                   ]
      v_symmetry:        [ p.Bool,     false                  ]

      above:             [ p.Array,    []                     ]
      below:             [ p.Array,    []                     ]
      left:              [ p.Array,    []                     ]
      right:             [ p.Array,    []                     ]

      renderers:         [ p.Array,    []                     ]

      x_range:           [ p.Instance                         ]
      extra_x_ranges:    [ p.Any,      {}                     ] # TODO (bev)
      y_range:           [ p.Instance                         ]
      extra_y_ranges:    [ p.Any,      {}                     ] # TODO (bev)

      x_mapper_type:     [ p.String,   'auto'                 ] # TODO (bev)
      y_mapper_type:     [ p.String,   'auto'                 ] # TODO (bev)

      toolbar:           [ p.Instance, () -> new Toolbar.Model() ]
      tool_events:       [ p.Instance, () -> new ToolEvents.Model() ]
      toolbar_location:  [ p.Location, 'above'                ]

      lod_factor:        [ p.Number,   10                     ]
      lod_interval:      [ p.Number,   300                    ]
      lod_threshold:     [ p.Number,   2000                   ]
      lod_timeout:       [ p.Number,   500                    ]

      webgl:             [ p.Bool,     false                  ]
      hidpi:             [ p.Bool,     true                   ]

      min_border:        [ p.Number,   MIN_BORDER             ]
      min_border_top:    [ p.Number,   null                   ]
      min_border_left:   [ p.Number,   null                   ]
      min_border_bottom: [ p.Number,   null                   ]
      min_border_right:  [ p.Number,   null                   ]

      grow:              [ p.Bool,     false                  ]
    }

module.exports =
  View: PlotView
  Model: Plot
