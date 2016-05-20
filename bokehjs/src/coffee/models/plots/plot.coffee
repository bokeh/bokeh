_ = require "underscore"
$ = require "jquery"

{WEAK_EQ, GE, EQ, Strength, Variable}  = require "../../core/layout/solver"
{logger} = require "../../core/logging"
p = require "../../core/properties"

LayoutDOM = require "../layouts/layout_dom"
Toolbar = require "../tools/toolbar"
ToolEvents = require "../../common/tool_events"
PlotCanvas = require("./plot_canvas").Model


class PlotView extends LayoutDOM.View
  className: "bk-plot-layout"


class Plot extends LayoutDOM.Model
  type: 'Plot'
  default_view: PlotView

  initialize: (options) ->
    super(options)
    
    @_horizontal = false
    if @toolbar_location in ['left', 'right']
      @_horizontal = true

    plot_only_options = ['toolbar_location', 'toolbar_sticky']
    plot_canvas_options = _.omit(options, plot_only_options)
    @_plot_canvas = new PlotCanvas(plot_canvas_options)

    @_set_orientation_variables(@)
    @_set_orientation_variables(@toolbar)
    @_set_orientation_variables(@_plot_canvas)

    @toolbar.location = @toolbar_location
    @toolbar.toolbar_sticky = @toolbar_sticky
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
    for child in @get_layoutable_children()
      edit_variables = edit_variables.concat(child.get_edit_variables())
    return edit_variables

  get_constraints: () ->
    constraints = super()

    if @toolbar_location?
      # Constraints if we have a toolbar
      #
      #  (1) COMPUTE THE VARIABLE PIECES (shrinks canvas): plot_height = plot_canvas_height + toolbar_height
      #  (2) SIZE THE FIXED: plot_width = plot_canvas_width 
      #  (3) stack or stick to the side 
      #      - note that below and right also require a css offset (couldn't find another way)
      #      - use canvas._top not canvas._dom_top as this lets us stick the
      #      toolbar right to the edge of the plot
      #  (4) nudge: set toolbar width to be almost full less that needed 
      #      to give a margin that lines up nicely with plot canvas edge


      # (1) plot_height = plot_canvas_height + toolbar_height | plot_width = plot_canvas_width + toolbar_width
      if @toolbar_sticky is true
        constraints.push(EQ(@_sizeable, [-1, @_plot_canvas._sizeable]))
      else
        constraints.push(EQ(@_sizeable, [-1, @_plot_canvas._sizeable], [-1, @toolbar._sizeable]))

      # (2) plot_width = plot_canvas_width | plot_height = plot_canvas_height | plot_height = plot_canvas_height
      constraints.push(EQ(@_full, [-1, @_plot_canvas._full]))

      if @toolbar_location is 'above'
        # (3) stack: plot_canvas._top = toolbar._dom_top + toolbar._height
        sticky_edge = if @toolbar_sticky is true then @_plot_canvas._top else @_plot_canvas._dom_top
        constraints.push(EQ(sticky_edge, [-1, @toolbar._dom_top], [-1, @toolbar._height]))

      if @toolbar_location is 'below'
        # (3) stack: plot_canvas._dom_top = toolbar._bottom - toolbar._height
        if @toolbar_sticky is false
          constraints.push(EQ(@toolbar._dom_top, [-1, @_plot_canvas._height], @toolbar._bottom))
        if @toolbar_sticky is true
          constraints.push(GE(@_plot_canvas.below_panel._height, [-1, @toolbar._height]))
          constraints.push(WEAK_EQ(@toolbar._dom_top, [-1, @_plot_canvas._height], @_plot_canvas.below_panel._height, @toolbar._height))

      if @toolbar_location is 'left'
        # (3) stack: plot_canvas._dom_left = toolbar._dom_left + toolbar._width
        sticky_edge = if @toolbar_sticky is true then @_plot_canvas._left else @_plot_canvas._dom_left
        constraints.push(EQ(sticky_edge, [-1, @toolbar._dom_left], [-1, @toolbar._width]))

      if @toolbar_location is 'right'
        # (3) stack: plot_canvas._dom_left = plot_canvas._right - toolbar._width
        if @toolbar_sticky is false
          constraints.push(EQ(@toolbar._dom_left, [-1, @_plot_canvas._width], @toolbar._right))
        if @toolbar_sticky is true
          constraints.push(GE(@_plot_canvas.right_panel._width, [-1, @toolbar._width]))
          constraints.push(WEAK_EQ(@toolbar._dom_left, [-1, @_plot_canvas._width], @_plot_canvas.right_panel._width, @toolbar._width))

      if @toolbar_location in ['above', 'below']
        # (4) toolbar_width = full_width - plot_canvas._right
        constraints.push(EQ(@_width, [-1, @toolbar._width], [-1, @_plot_canvas._width_minus_right]))

      if @toolbar_location in ['left', 'right']
        # (4a) the following makes the toolbar as tall as the plot less the distance of the axis from the edge 
        constraints.push(EQ(@_height, [-1, @toolbar._height], [-1, @_plot_canvas.above_panel._height]))
        # (4b) nudge the toolbar down by that distance
        constraints.push(EQ(@toolbar._dom_top, [-1, @_plot_canvas.above_panel._height]))


    if not @toolbar_location?
      # If we don't have a toolbar just set them
      constraints.push(EQ(@_width, [-1, @_plot_canvas._width]))
      constraints.push(EQ(@_height, [-1, @_plot_canvas._height]))

    # Get all the child constraints
    for child in @get_layoutable_children()
      constraints = constraints.concat(child.get_constraints())

    return constraints

  get_constrained_variables: () ->
    return _.extend {}, super(), {
      'on-edge-align-top'    : @_plot_canvas._top
      'on-edge-align-bottom' : @_plot_canvas._height_minus_bottom
      'on-edge-align-left'   : @_plot_canvas._left
      'on-edge-align-right'  : @_plot_canvas._width_minus_right

      'box-cell-align-top'   : @_plot_canvas._top
      'box-cell-align-bottom': @_plot_canvas._height_minus_bottom
      'box-cell-align-left'  : @_plot_canvas._left
      'box-cell-align-right' : @_plot_canvas._width_minus_right

      'box-equal-size-top'   : @_plot_canvas._top
      'box-equal-size-bottom': @_plot_canvas._height_minus_bottom
      'box-equal-size-left'  : @_plot_canvas._left
      'box-equal-size-right' : @_plot_canvas._width_minus_right
    }

  _set_orientation_variables: (model) ->
    if @_horizontal is false  # toolbar is above or below or null
      model._sizeable = model._height
      model._full = model._width
    if @_horizontal is true  # toolbar is left or right
      model._sizeable = model._width
      model._full = model._height

  # 
  # SETUP PROPERTIES
  #
  @mixins ['line:outline_', 'text:title_', 'fill:background_', 'fill:border_']

  @define {
      toolbar:           [ p.Instance, () -> new Toolbar.Model() ]
      toolbar_location:  [ p.Location, 'above'                   ]
      toolbar_sticky:    [ p.Bool, true                       ]
      
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
