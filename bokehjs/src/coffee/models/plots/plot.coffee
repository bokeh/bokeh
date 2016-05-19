_ = require "underscore"
$ = require "jquery"

build_views = require "../../common/build_views"
ToolEvents = require "../../common/tool_events"

BokehView = require "../../core/bokeh_view"
{WEAK_EQ, GE, EQ, Strength, Variable}  = require "../../core/layout/solver"
{logger} = require "../../core/logging"
p = require "../../core/properties"

LayoutDOM = require "../layouts/layout_dom"
Toolbar = require "../tools/toolbar"

PlotCanvas = require("./plot_canvas").Model


class PlotView extends BokehView
  className: "bk-plot-layout"

  initialize: (options) ->
    super(options)
    # Provides a hook so document can measure
    @$el.attr("id", "modelid_#{@model.id}")

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
    #logger.debug("#{@model} _dom_left: #{@model._dom_left._value}, _dom_top: #{@model._dom_top._value}")
    #logger.debug("#{@model} _top: #{@model._top._value}, _right: #{@model._right._value}, _bottom: #{@model._bottom._value}, _left: #{@model._left._value}")
    #logger.debug("#{@model} _width: #{@model._width._value}, _height: #{@model._height._value}")
    #logger.debug("#{@model} _width_minus_right: #{@model._width_minus_right._value}, _width_minus_left: #{@model._width_minus_left._value}, _height_minus_bottom: #{@model._height_minus_bottom._value}")
    #logger.debug("#{@model} _right_minus_left: #{@model._right_minus_left._value}, _bottom_minus_top: #{@model._bottom_minus_top._value}")
    @$el.css({
      position: 'absolute'
      #We currently have a property coming from box, and a variable coming internally!
      #left: @model.dom_left
      #top: @model.dom_top
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
    if @toolbar_location in ['left', 'right']
      @_horizontal = true

    plot_canvas_options = _.omit(options, 'toolbar_location')
    @_plot_canvas = new PlotCanvas(plot_canvas_options)

    @_set_orientation_variables(@)
    @_set_orientation_variables(@toolbar)
    @_set_orientation_variables(@_plot_canvas)

    @toolbar.location = @toolbar_location
    @_plot_canvas.toolbar = @toolbar

  _doc_attached: () ->
    @_plot_canvas.attach_document(@document)

  plot_canvas: () ->
    @_plot_canvas

  get_layoutable_children: () ->
    # Default if toolbar_location is None
    children = [@_plot_canvas]
    if @toolbar_location?
      children = [@toolbar, @_plot_canvas]
    return children

  get_edit_variables: () ->
    edit_variables = []
    edit_variables.push({'edit_variable': @_dom_left, 'strength': Strength.strong})
    edit_variables.push({'edit_variable': @_dom_top, 'strength': Strength.strong})
    for child in @get_layoutable_children()
      edit_variables = edit_variables.concat(child.get_edit_variables())
    return edit_variables

  get_constraints: () ->
    constraints = super()

    # CONSTRAINTS (if toolbar is above)
    # Size:
    # * (1) COMPUTE THE VARIABLE PIECES (shrinks canvas): plot_height = plot_canvas_height + toolbar_height
    # * (2) SIZE THE FIXED: plot_width = plot_canvas_width 
    # * (3) SIZE THE FIXED: plot_width = toolbar_width
    # Position:
    # * (4) stack or stick to the side - note that below and right also require a css offset (couldn't find another way)

    if @toolbar_location?
      # (1) plot_height = plot_canvas_height + toolbar_height | plot_width = plot_canvas_width + toolbar_width
      constraints.push(EQ(@_sizeable, [-1, @_plot_canvas._sizeable], [-1, @toolbar._sizeable]))
      # (2) plot_width = plot_canvas_width | plot_height = plot_canvas_height | plot_height = plot_canvas_height
      constraints.push(EQ(@_full, [-1, @_plot_canvas._full]))
      # (3) plot_full = toolbar_full | plot_height = toolbar_height | plot_height = toolbar_height
      constraints.push(EQ(@_full, [-1, @toolbar._full]))

      if @toolbar_location == 'above'
        # (4) stack: plot_canvas._dom_top = toolbar._dom_top + toolbar._height
        constraints.push(EQ(@_plot_canvas._dom_top, [-1, @toolbar._dom_top], [-1, @toolbar._height]))

      if @toolbar_location == 'below'
        constraints.push(EQ(@toolbar._dom_top, [-1, @_plot_canvas._height], @toolbar._bottom))

      if @toolbar_location == 'left'
        # (4) stack: plot_canvas._dom_left = toolbar._dom_left + toolbar._width
        constraints.push(EQ(@_plot_canvas._dom_left, [-1, @toolbar._dom_left], [-1, @toolbar._width]))

      if @toolbar_location == 'right'
        constraints.push(EQ(@toolbar._dom_left, [-1, @_plot_canvas._width], @toolbar._right))

    if not @toolbar_location?
      console.log('in else')
      constraints.push(EQ(@_width, [-1, @_plot_canvas._width]))
      constraints.push(EQ(@_height, [-1, @_plot_canvas._height]))

    # Get all the child constraints
    for child in @get_layoutable_children()
      constraints = constraints.concat(child.get_constraints())

    return constraints

  _set_orientation_variables: (model) ->
    if @_horizontal == false  # toolbar is above or below or null
      model._sizeable = model._height
      model._full = model._width
    if @_horizontal == true  # toolbar is left or right
      model._sizeable = model._width
      model._full = model._height

  # 
  # SETUP PROPERTIES
  #
  @internal {
    dom_left: [ p.Number, 0 ]
    dom_top: [ p.Number, 0 ]
  }

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
