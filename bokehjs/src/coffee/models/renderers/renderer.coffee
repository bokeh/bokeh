_ = require "underscore"
proj4 = require "../../common/proj4"
toProjection = proj4.defs('GOOGLE')

BokehView = require "../../core/bokeh_view"
{logger} = require "../../core/logging"
p = require "../../core/properties"
{array_max} = require "../../core/util/math"
{Visuals} = require "../../common/visuals"
Model = require "../../model"

class RendererView extends BokehView

  initialize: (options) ->
    super(options)
    @plot_model = options.plot_model
    @plot_view = options.plot_view
    @visuals = new Visuals(@model)

  request_render: () ->
    @plot_view.request_render()

  map_data: () ->
    # todo: if using gl, skip this (when is this called?)

    # map all the coordinate fields
    for [xname, yname] in @model._coords
      sxname = "s#{xname}"
      syname = "s#{yname}"
      xname = "_#{xname}"
      yname = "_#{yname}"
      if _.isArray(@[xname]?[0])
        [ @[sxname], @[syname] ] = [ [], [] ]
        for i in [0...@[xname].length]
          [sx, sy] = @map_to_screen(@[xname][i], @[yname][i])
          @[sxname].push(sx)
          @[syname].push(sy)
      else
        [ @[sxname], @[syname] ] = @map_to_screen(@[xname], @[yname])

    @_map_data()

  _project_xy: (x, y) ->
    merc_x_s = []
    merc_y_s = []
    for i in [0...x.length]
      [merc_x, merc_y] = proj4(toProjection, [x[i], y[i]])
      merc_x_s[i] = merc_x
      merc_y_s[i] = merc_y
    return [merc_x_s, merc_y_s]

  _project_xsys: (xs, ys) ->
    merc_xs_s = []
    merc_ys_s = []
    for i in [0...xs.length]
      [merc_x_s, merc_y_s] = @_project_xy(xs[i], ys[i])
      merc_xs_s[i] = merc_x_s
      merc_ys_s[i] = merc_y_s
    return [merc_xs_s, merc_ys_s]

  set_data: (source) ->
    # set all the coordinate fields
    for name, prop of @model.properties
      if not prop.dataspec
        continue
      # this skips optional properties like radius for circles
      if (prop.optional || false) and prop.spec.value == null and (name not of @model._set_after_defaults)
        continue
      @["_#{name}"] = prop.array(source)
      if prop instanceof p.Distance
        @["max_#{name}"] = array_max(@["_#{name}"])

    if @plot_model.use_map
      if @_x?
        [@_x, @_y] = @_project_xy(@_x, @_y)
      if @_xs?
        [@_xs, @_ys] = @_project_xsys(@_xs, @_ys)

    if @glglyph?
      @glglyph.set_data_changed(@_x.length)

    @_set_data()

    @index = @_index_data()

  _set_data: () -> null
  _map_data: () -> null
  _index_data: () -> null
  _mask_data: (inds) -> inds
  _bounds: (bds) -> bds

  set_visuals: (source) ->
    @visuals.warm_cache(source)

  map_to_screen: (x, y) ->
    @plot_view.map_to_screen(x, y, @model.x_range_name, @model.y_range_name)

class Renderer extends Model
  type: "Renderer"

  @define {
    level: [ p.RenderLevel, null ]
    visible: [ p.Bool, true ]
  }

module.exports = {
  Model: Renderer
  View: RendererView
}
