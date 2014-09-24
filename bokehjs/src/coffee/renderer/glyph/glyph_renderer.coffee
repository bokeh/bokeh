define [
  "underscore"
  "common/logging"
  "common/has_parent"
  "common/collection"
  "common/plot_widget"
], (_, Logging, HasParent, Collection, PlotWidget) ->

  logger = Logging.logger

  class GlyphRendererView extends PlotWidget

    initialize: (options) ->
      super(options)

      @glyph = @mget("glyph")

      @selection_glyph    = @mget("selection_glyph")    or @glyph
      @nonselection_glyph = @mget("nonselection_glyph") or @glyph

      @need_set_data = true

      @x_range_name = @mget('x_range_name')
      @y_range_name = @mget('y_range_name')

      @xmapper = @plot_view.frame.get('x_mappers')[@x_range_name]
      @ymapper = @plot_view.frame.get('y_mappers')[@y_range_name]

      if @mget('server_data_source')
        @setup_server_data()
      @listenTo(this, 'change:server_data_source', @setup_server_data)

    bind_bokeh_events: () ->
      @listenTo(@model, 'change', @request_render)
      @listenTo(@mget('data_source'), 'change', @set_data)

    have_selection_props: ->
      @mget("selection_glyph")? or @mget("nonselection_glyph")?

    #TODO: There are glyph sub-type-vs-resample_op concordance issues...
    setup_server_data: () ->
      serversource = @mget('server_data_source')
      # hack, call set data, becuase there are some attrs that we need
      # that are in it
      data = _.extend({}, @mget('data_source').get('data'), serversource.get('data'))
      @mget('data_source').set('data', data)
      @set_data(false)

      transform_params = serversource.attributes['transform']
      resample_op = transform_params['resample']
      x_range = @plot_view.frame.get('h_range')
      y_range = @plot_view.frame.get('v_range')

      #TODO: This is weird.  For example, h_range is passed in twice.  Hugo or Joseph should clean it up
      if (resample_op == 'line1d')
        domain = transform_params['domain']
        if domain == 'x'
          serversource.listen_for_line1d_updates(
            @mget('data_source'),
            x_range,  y_range,
            @plot_view.x_range, @plot_view.y_range,
            x_range,
            @glyph_props.y.field,
            @glyph_props.x.field,
            [@glyph_props.y.field],
            transform_params
          )
        else
          throw new Error("Domains other than 'x' not supported yet.")
      else if (resample_op == 'heatmap')
        serversource.listen_for_heatmap_updates(
           @mget('data_source'),
           x_range,  y_range,
           @plot_view.x_range,
           @plot_view.y_range,
           transform_params
        )
      else if (resample_op == 'abstract rendering')
        serversource.listen_for_ar_updates(
           @plot_view
           @mget('data_source'),
             #TODO: Joseph -- Get rid of the next four params because we're passing in the plot_view
           x_range,  y_range,
           @plot_view.x_range,
           @plot_view.y_range,
           transform_params)
      else
        logger.warn("unknown resample op: '#{resample_op}'")

  class GlyphRenderer extends HasParent

    defaults: ->
      return _.extend {}, super(), {
        x_range_name: "default"
        y_range_name: "default"
        data_source: null
      }

    display_defaults: ->
      return _.extend {}, super(), {
        level: 'glyph'
        radius_units: 'data'
        length_units: 'screen'
        angle_units: 'deg'
        start_angle_units: 'deg'
        end_angle_units: 'deg'
      }

  class GlyphRenderers extends Collection
    model: GlyphRenderer

  return {
    Model: GlyphRenderer
    View: GlyphVRendereriew
    Collection: new GlyphRenderers()
  }
