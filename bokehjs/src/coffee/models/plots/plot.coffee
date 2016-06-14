_ = require "underscore"

{WEAK_EQ, GE, EQ, Strength, Variable}  = require "../../core/layout/solver"
{logger} = require "../../core/logging"
p = require "../../core/properties"

LayoutDOM = require "../layouts/layout_dom"
Toolbar = require "../tools/toolbar"
ToolEvents = require "../../common/tool_events"
PlotCanvas = require("./plot_canvas").Model

ColumnDataSource = require "../sources/column_data_source"
GlyphRenderer = require "../renderers/glyph_renderer"
Title = require "../annotations/title"

class PlotView extends LayoutDOM.View
  className: "bk-plot-layout"

  render: () ->
    super()

    if @model.responsive is 'box_ar'
      [width, height] = @get_width_height()
      s = @model.document.solver()
      s.suggest_value(@model._width, width)
      s.suggest_value(@model._height, height)
      @$el.css({
        position: 'absolute'
        left: @model._dom_left._value
        top: @model._dom_top._value
        width: @model.width
        height: @model.height
      })

  get_width_height: () ->
      parent_height = @el.parentNode.clientHeight
      parent_width = @el.parentNode.clientWidth

      ar = @model.get_aspect_ratio()

      new_width_1 = parent_width
      new_height_1 = parent_width / ar

      new_width_2 = parent_height * ar
      new_height_2 = parent_height

      if new_width_1 < new_width_2
        width = new_width_1
        height = new_height_1
      else
        width = new_width_2
        height = new_height_2

      return [width, height]

  get_height: () ->
    return @model._width._value / @model.get_aspect_ratio()

  get_width: () ->
    return @model._height._value * @model.get_aspect_ratio()

class Plot extends LayoutDOM.Model
  type: 'Plot'
  default_view: PlotView

  initialize: (options) ->
    super(options)

    for xr in _.values(@extra_x_ranges).concat(@x_range)
      plots = xr.get('plots')
      if _.isArray(plots)
        plots = plots.concat(@)
        xr.set('plots', plots)
    for yr in _.values(@extra_y_ranges).concat(@y_range)
      plots = yr.get('plots')
      if _.isArray(plots)
        plots = plots.concat(@)
        yr.set('plots', plots)

    @_horizontal = false
    if @toolbar_location in ['left', 'right']
      @_horizontal = true

    # Min border applies to the edge of everything
    if @min_border?
      if not @min_border_top?
        @min_border_top = @min_border
      if not @min_border_bottom?
        @min_border_bottom = @min_border
      if not @min_border_left?
        @min_border_left = @min_border
      if not @min_border_right?
        @min_border_right = @min_border

    # Add the title to layout
    if @title?
      title = if _.isString(@title) then new Title.Model({text: @title}) else @title
      @add_layout(title, @title_location)

    @_plot_canvas = new PlotCanvas({plot: @})

    @_set_orientation_variables(@)
    @_set_orientation_variables(@toolbar)
    @_set_orientation_variables(@plot_canvas)

    @toolbar.toolbar_location = @toolbar_location
    @toolbar.toolbar_sticky = @toolbar_sticky
    @plot_canvas.toolbar = @toolbar

    # Set width & height to be the passed in plot_width and plot_height
    # We may need to be more subtle about this - not sure why people use one
    # or the other.
    if not @width?
      @width = @plot_width
    if not @height?
      @height = @plot_height

  Object.defineProperty(this.prototype, "plot_canvas", { get: () -> @_plot_canvas })

  _doc_attached: () ->

    # Add panels for any side renderers
    # (Needs to be called in _doc_attached, so that panels can attach to the document.)
    for side in ['above', 'below', 'left', 'right']
      layout_renderers = @get(side)
      for r in layout_renderers
        r.add_panel(side)

    @plot_canvas.attach_document(@document)

  add_renderers: (new_renderers...) ->
    renderers = @get('renderers')
    renderers = renderers.concat(new_renderers)
    @set('renderers', renderers)

  add_layout: (renderer, side="center") ->
    if renderer.props.plot?
      renderer.plot = this
    @add_renderers(renderer)
    if side != 'center'
      if @document?
        renderer.add_panel(side)
      @set(side, @get(side).concat([renderer]))

  add_glyph: (glyph, source, attrs={}) ->
    if not source?
      source = new ColumnDataSource.Model()

    attrs = _.extend({}, attrs, {data_source: source, glyph: glyph})
    renderer = new GlyphRenderer.Model(attrs)

    @add_renderers(renderer)

    return renderer

  add_tools: (tools...) ->
    new_tools = for tool in tools
      if tool.overlay?
        @add_renderers(tool.overlay)

      if tool.plot?
        tool
      else
        # XXX: this part should be unnecessary, but you can't configure tool.plot
        # after construting a tool. When this limitation is lifted, remove this code.
        attrs = _.clone(tool.attributes)
        attrs.plot = this
        new tool.constructor(attrs)

    @set(@toolbar.tools, @get("toolbar").tools.concat(new_tools))

  get_aspect_ratio: () ->
    return @width / @height

  get_layoutable_children: () ->
    # Default if toolbar_location is None
    children = [@plot_canvas]
    if @toolbar_location?
      children = [@toolbar, @plot_canvas]
    return children

  get_edit_variables: () ->
    edit_variables = super()
    if @responsive is 'box_ar'
      edit_variables.push({edit_variable: @_width, strength: Strength.strong})
      edit_variables.push({edit_variable: @_height, strength: Strength.strong})
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
        constraints.push(EQ(@_sizeable, [-1, @plot_canvas._sizeable]))
      else
        constraints.push(EQ(@_sizeable, [-1, @plot_canvas._sizeable], [-1, @toolbar._sizeable]))

      # (2) plot_width = plot_canvas_width | plot_height = plot_canvas_height | plot_height = plot_canvas_height
      constraints.push(EQ(@_full, [-1, @plot_canvas._full]))

      if @toolbar_location is 'above'
        # (3) stack: plot_canvas._top = toolbar._dom_top + toolbar._height
        sticky_edge = if @toolbar_sticky is true then @plot_canvas._top else @plot_canvas._dom_top
        constraints.push(EQ(sticky_edge, [-1, @toolbar._dom_top], [-1, @toolbar._height]))

      if @toolbar_location is 'below'
        # (3) stack: plot_canvas._dom_top = toolbar._bottom - toolbar._height
        if @toolbar_sticky is false
          constraints.push(EQ(@toolbar._dom_top, [-1, @plot_canvas._height], @toolbar._bottom))
        if @toolbar_sticky is true
          constraints.push(GE(@plot_canvas.below_panel._height, [-1, @toolbar._height]))
          constraints.push(WEAK_EQ(@toolbar._dom_top, [-1, @plot_canvas._height], @plot_canvas.below_panel._height, @toolbar._height))

      if @toolbar_location is 'left'
        # (3) stack: plot_canvas._dom_left = toolbar._dom_left + toolbar._width
        sticky_edge = if @toolbar_sticky is true then @plot_canvas._left else @plot_canvas._dom_left
        constraints.push(EQ(sticky_edge, [-1, @toolbar._dom_left], [-1, @toolbar._width]))

      if @toolbar_location is 'right'
        # (3) stack: plot_canvas._dom_left = plot_canvas._right - toolbar._width
        if @toolbar_sticky is false
          constraints.push(EQ(@toolbar._dom_left, [-1, @plot_canvas._width], @toolbar._right))
        if @toolbar_sticky is true
          constraints.push(GE(@plot_canvas.right_panel._width, [-1, @toolbar._width]))
          constraints.push(WEAK_EQ(@toolbar._dom_left, [-1, @plot_canvas._width], @plot_canvas.right_panel._width, @toolbar._width))

      if @toolbar_location in ['above', 'below']
        # (4) toolbar_width = full_width - plot_canvas._right
        constraints.push(EQ(@_width, [-1, @toolbar._width], [-1, @plot_canvas._width_minus_right]))

      if @toolbar_location in ['left', 'right']
        # (4a) the following makes the toolbar as tall as the plot less the distance of the axis from the edge
        constraints.push(EQ(@_height, [-1, @toolbar._height], [-1, @plot_canvas.above_panel._height]))
        # (4b) nudge the toolbar down by that distance
        constraints.push(EQ(@toolbar._dom_top, [-1, @plot_canvas.above_panel._height]))


    if not @toolbar_location?
      # If we don't have a toolbar just set them
      constraints.push(EQ(@_width, [-1, @plot_canvas._width]))
      constraints.push(EQ(@_height, [-1, @plot_canvas._height]))

    # Get all the child constraints
    for child in @get_layoutable_children()
      constraints = constraints.concat(child.get_constraints())

    return constraints

  get_constrained_variables: () ->
    constrained_variables = super()
    constrained_variables = _.extend(constrained_variables, {
      'on-edge-align-top'    : @plot_canvas._top
      'on-edge-align-bottom' : @plot_canvas._height_minus_bottom
      'on-edge-align-left'   : @plot_canvas._left
      'on-edge-align-right'  : @plot_canvas._width_minus_right

      'box-cell-align-top'   : @plot_canvas._top
      'box-cell-align-bottom': @plot_canvas._height_minus_bottom
      'box-cell-align-left'  : @plot_canvas._left
      'box-cell-align-right' : @plot_canvas._width_minus_right

      'box-equal-size-top'   : @plot_canvas._top
      'box-equal-size-bottom': @plot_canvas._height_minus_bottom
    })
    if @responsive isnt 'fixed'
      constrained_variables = _.extend(constrained_variables, {
        'box-equal-size-left'  : @plot_canvas._left
        'box-equal-size-right' : @plot_canvas._width_minus_right
      })
    return constrained_variables

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
  @mixins ['line:outline_', 'fill:background_', 'fill:border_']

  @define {
      toolbar:           [ p.Instance, () -> new Toolbar.Model() ]
      toolbar_location:  [ p.Location, 'right'                ]
      toolbar_sticky:    [ p.Bool, true                       ]

      # ALL BELOW ARE FOR PLOT CANVAS
      plot_width:        [ p.Number,   600                    ]
      plot_height:       [ p.Number,   600                    ]
      title:             [ p.Any                              ] # TODO: p.Either(p.Instance(Title), p.String)
      title_location:    [ p.Location, 'above'                ]

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

      min_border:        [ p.Number,   5                      ]
      min_border_top:    [ p.Number,   null                   ]
      min_border_left:   [ p.Number,   null                   ]
      min_border_bottom: [ p.Number,   null                   ]
      min_border_right:  [ p.Number,   null                   ]
    }

  @override {
    outline_line_color: '#e5e5e5'
    border_fill_color: "#ffffff"
    background_fill_color: "#ffffff"
    responsive: 'fixed'
  }

module.exports =
  View: PlotView
  Model: Plot
