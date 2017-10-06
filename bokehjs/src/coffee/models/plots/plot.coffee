import {WEAK_EQ, GE, EQ} from "core/layout/solver"
import {logger} from "core/logging"
import * as p from "core/properties"
import {extend, values, clone} from "core/util/object"
import {isString, isArray} from "core/util/types"

import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {Title} from "../annotations/title"
import {LinearScale} from "../scales/linear_scale"
import {Toolbar} from "../tools/toolbar"
import {ToolbarPanel} from "../annotations/toolbar_panel"
import {PlotCanvas, PlotCanvasView} from "./plot_canvas"

import {ColumnDataSource} from "../sources/column_data_source"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import {register_with_event, UIEvent} from 'core/bokeh_events'

export class PlotView extends LayoutDOMView
  className: "bk-plot-layout"

  connect_signals: () ->
    super()
    # Note: Title object cannot be replaced after initialization, similar to axes, and also
    # not being able to change the sizing_mode. All of these changes require a re-initialization
    # of all constraints which we don't currently support.
    title_msg = "Title object cannot be replaced. Try changing properties on title to update it after initialization."
    @connect(@model.properties.title.change, () => logger.warn(title_msg))

  render: () ->
    super()

    if @model.sizing_mode == 'scale_both'
      [width, height] = @get_width_height()
      @solver.suggest_value(@model._width, width)
      @solver.suggest_value(@model._height, height)
      @solver.update_variables()
      @el.style.position = 'absolute'
      @el.style.left = "#{@model._dom_left.value}px"
      @el.style.top = "#{@model._dom_top.value}px"
      @el.style.width = "#{@model._width.value}px"
      @el.style.height = "#{@model._height.value}px"

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
    return @model._width.value / @model.get_aspect_ratio()

  get_width: () ->
    return @model._height.value * @model.get_aspect_ratio()

  save: (name) ->
    @plot_canvas_view.save(name)

  @getters {
    plot_canvas_view: () -> (view for view in values(@child_views) when view instanceof PlotCanvasView)[0]
  }

export class Plot extends LayoutDOM
  type: 'Plot'
  default_view: PlotView

  initialize: (options) ->
    super(options)
    for xr in values(@extra_x_ranges).concat(@x_range)
      plots = xr.plots
      if isArray(plots)
        plots = plots.concat(@)
        xr.setv('plots', plots, {silent: true})
    for yr in values(@extra_y_ranges).concat(@y_range)
      plots = yr.plots
      if isArray(plots)
        plots = plots.concat(@)
        yr.setv('plots', plots, {silent: true})

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
      title = if isString(@title) then new Title({text: @title}) else @title
      @add_layout(title, @title_location)

    @_plot_canvas = @_init_plot_canvas()

    @toolbar.toolbar_location = @toolbar_location
    @plot_canvas.toolbar = @toolbar

    switch @toolbar_location
      when "left", "right", "above", "below"
        panel = new ToolbarPanel({toolbar: @toolbar})
        @add_layout(panel, @toolbar_location)

    # Set width & height to be the passed in plot_width and plot_height
    # We may need to be more subtle about this - not sure why people use one
    # or the other.
    if not @width?
      @width = @plot_width
    if not @height?
      @height = @plot_height

    # Setup side renderers
    for side in ['above', 'below', 'left', 'right']
      layout_renderers = @getv(side)
      for renderer in layout_renderers
        renderer.add_panel(side)

  _init_plot_canvas: () ->
    return new PlotCanvas({plot: @})

  @getters {
    plot_canvas: () -> @_plot_canvas
  }

  _doc_attached: () ->
    @plot_canvas.attach_document(@document)
    super()

  add_renderers: (new_renderers...) ->
    renderers = @renderers
    renderers = renderers.concat(new_renderers)
    @renderers = renderers

  add_layout: (renderer, side="center") ->
    if renderer.props.plot?
      renderer.plot = this
    if side != 'center'
      side_renderers = @getv(side)
      side_renderers.push(renderer)
      renderer.add_panel(side)
    @add_renderers(renderer)

  add_glyph: (glyph, source, attrs={}) ->
    if not source?
      source = new ColumnDataSource()
    attrs = extend({}, attrs, {data_source: source, glyph: glyph})
    renderer = new GlyphRenderer(attrs)
    @add_renderers(renderer)
    return renderer

  add_tools: (tools...) ->
    for tool in tools
      if tool.overlay?
        @add_renderers(tool.overlay)

    @toolbar.tools = @toolbar.tools.concat(tools)

  get_aspect_ratio: () ->
    return @width / @height

  get_layoutable_children: () ->
    return [@plot_canvas]

  get_editables: () ->
    editables = super()
    if @sizing_mode == 'scale_both'
      editables = editables.concat([@_width, @_height])
    return editables

  get_constraints: () ->
    constraints = super()

    constraints.push(EQ(@_width,  [-1, @plot_canvas._width ]))
    constraints.push(EQ(@_height, [-1, @plot_canvas._height]))

    return constraints

  get_constrained_variables: () ->
    vars = extend({}, super(), {
      on_edge_align_top    : @plot_canvas._top
      on_edge_align_bottom : @plot_canvas._height_minus_bottom
      on_edge_align_left   : @plot_canvas._left
      on_edge_align_right  : @plot_canvas._width_minus_right

      box_cell_align_top   : @plot_canvas._top
      box_cell_align_bottom: @plot_canvas._height_minus_bottom
      box_cell_align_left  : @plot_canvas._left
      box_cell_align_right : @plot_canvas._width_minus_right

      box_equal_size_top   : @plot_canvas._top
      box_equal_size_bottom: @plot_canvas._height_minus_bottom
    })

    if @sizing_mode != 'fixed'
      vars.box_equal_size_left  = @plot_canvas._left
      vars.box_equal_size_right = @plot_canvas._width_minus_right

    return vars

  #
  # SETUP PROPERTIES
  #
  @mixins ['line:outline_', 'fill:background_', 'fill:border_']

  @define {
      toolbar:           [ p.Instance, () -> new Toolbar() ]
      toolbar_location:  [ p.Location, 'right'                ]

      plot_width:        [ p.Number,   600                    ]
      plot_height:       [ p.Number,   600                    ]

      title:             [ p.Any, () -> new Title({text: ""})] # TODO: p.Either(p.Instance(Title), p.String)
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

      x_scale:           [ p.Instance, () -> new LinearScale() ]
      y_scale:           [ p.Instance, () -> new LinearScale() ]

      lod_factor:        [ p.Number,   10                     ]
      lod_interval:      [ p.Number,   300                    ]
      lod_threshold:     [ p.Number,   2000                   ]
      lod_timeout:       [ p.Number,   500                    ]

      hidpi:             [ p.Bool,     true                   ]
      output_backend:    [ p.OutputBackend, "canvas"          ]

      min_border:        [ p.Number,   5                      ]
      min_border_top:    [ p.Number,   null                   ]
      min_border_left:   [ p.Number,   null                   ]
      min_border_bottom: [ p.Number,   null                   ]
      min_border_right:  [ p.Number,   null                   ]

      inner_width:       [ p.Number                           ]
      inner_height:      [ p.Number                           ]
      layout_width:      [ p.Number                           ]
      layout_height:     [ p.Number                           ]

      match_aspect:      [ p.Bool,     false                  ]
      aspect_scale:      [ p.Number,   1                      ]
    }

  @override {
    outline_line_color: '#e5e5e5'
    border_fill_color: "#ffffff"
    background_fill_color: "#ffffff"
  }

  @getters {
    all_renderers: () ->
      renderers = @renderers
      for tool in @toolbar.tools
        renderers = renderers.concat(tool.synthetic_renderers)
      return renderers
    x_mapper_type: () ->
      log.warning("x_mapper_type attr is deprecated, use x_scale")
      return @x_scale
    y_mapper_type: () ->
      log.warning("y_mapper_type attr is deprecated, use y_scale")
      return @y_scale
    webgl: () ->
      log.warning("webgl attr is deprecated, use output_backend")
      return @output_backend == "webgl"
    tool_events: () ->
      log.warning("tool_events attr is deprecated, use SelectionGeometry Event")
      return null
  }

register_with_event(UIEvent, Plot)
