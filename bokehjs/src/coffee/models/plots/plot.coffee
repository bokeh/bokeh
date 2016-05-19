_ = require "underscore"

ToolEvents = require "../../common/tool_events"

BokehView = require "../../core/bokeh_view"
{GE}  = require "../../core/layout/solver"
p = require "../../core/properties"

LayoutDOM = require "../layouts/layout_dom"
Toolbar = require "../tools/toolbar"

PlotCanvas = require("./plot_canvas").Model

class PlotView extends BokehView


class Plot extends LayoutDOM.Model
  type: 'Plot'
  default_view: PlotView

  initialize: (options) ->
    super(options)
    @_horizontal = false
    @toolbar.location = @toolbar_location
    plot_canvas_options = _.omit(options, 'toolbar_location')
    @_plot_canvas = new PlotCanvas(plot_canvas_options)
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

  # 
  # SETUP PROPERTIES
  #
  MIN_BORDER = 5

  @mixins ['line:outline_', 'text:title_', 'fill:background_', 'fill:border_']

  @define {
      toolbar:           [ p.Instance, () -> new Toolbar.Model() ]
      toolbar_location:  [ p.Location, 'above'                   ]
      
      # ALL BELOW ARE FOR PLOT CANVAS
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

      tool_events:       [ p.Instance, () -> new ToolEvents.Model() ]

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
    }

module.exports =
  View: PlotView
  Model: Plot
