_ = require "underscore"
$ = require "jquery"

build_views = require "../../common/build_views"
ToolEvents = require "../../common/tool_events"

BokehView = require "../../core/bokeh_view"
{GE, EQ, Variable}  = require "../../core/layout/solver"
p = require "../../core/properties"

LayoutDOM = require "../layouts/layout_dom"
Toolbar = require "../tools/toolbar"

PlotCanvas = require("./plot_canvas").Model


class PlotView extends BokehView
  className: "bk-plot-layout"

  initialize: (options) ->
    super(options)

    children = @model.get_layoutable_children()
    @child_views = {}
    build_views(@child_views, children)
  
    for own key, child_view of @child_views
      @$el.append(child_view.$el)

    @bind_bokeh_events()

    if @model._is_root == true
      resize = () -> $(window).trigger('resize')
      _.delay(resize, 5)
      _.delay(resize, 50)

  bind_bokeh_events: () ->
    @listenTo(@model, 'change', @render)
    @listenTo(@model.document.solver(), 'resize', @render)

  render: () ->
    console.log("#{@model} _dom_left: #{@model._dom_left._value}, _dom_top: #{@model._dom_top._value}")
    console.log("#{@model} _top: #{@model._top._value}, _right: #{@model._right._value}, _bottom: #{@model._bottom._value}, _left: #{@model._left._value}")
    console.log("#{@model} _width: #{@model._width._value}, _height: #{@model._height._value}")
    @$el.css({
      position: 'absolute'
      left: @model._dom_left._value
      top: @model._dom_top._value
      'width': @model._width._value
      'height': @model._height._value
    })


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

  plot_canvas: () ->
    @_plot_canvas

  get_layoutable_children: () ->
    toolbar_location = @toolbar_location
    if toolbar_location in ['left', 'right']
      @_horizontal = true
    # Default if toolbar_location is None
    children = [@_plot_canvas]
    if toolbar_location in ['above', 'left']
      # Toolbar is first
      children = [@toolbar, @_plot_canvas]
    if toolbar_location in ['below', 'right']
      # Toolbar is second
      children = [@_plot_canvas, @toolbar]
    return children

  get_edit_variables: () ->
    edit_variables = []
    for child in @get_layoutable_children()
      edit_variables = edit_variables.concat(child.get_edit_variables())
    return edit_variables

  get_constraints: () ->
    constraints = []
    # Dom position should always be greater than 0
    constraints.push(GE(@_dom_left))
    constraints.push(GE(@_dom_top))
    # plot has to be inside the width/height
    constraints.push(GE(@_left))
    constraints.push(GE(@_width, [-1, @_right]))
    constraints.push(GE(@_top))
    constraints.push(GE(@_height, [-1, @_bottom]))

    if not toolbar_location?
      constraints.push(EQ(@_width, [-1, @_plot_canvas._width]))
      constraints.push(EQ(@_height, [-1, @_plot_canvas._height]))

    # Get all the child constraints
    for child in @get_layoutable_children()
      constraints = constraints.concat(child.get_constraints())

    return constraints

  get_constrained_variables: () ->
    {
      "width": @_width
      "height": @_height
    }

  # 
  # SETUP PROPERTIES
  #
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

      min_border:        [ p.Number,   null                   ]
      min_border_top:    [ p.Number,   null                   ]
      min_border_left:   [ p.Number,   null                   ]
      min_border_bottom: [ p.Number,   null                   ]
      min_border_right:  [ p.Number,   null                   ]
    }

module.exports =
  View: PlotView
  Model: Plot
