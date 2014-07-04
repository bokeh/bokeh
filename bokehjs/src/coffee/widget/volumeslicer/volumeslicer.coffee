define [
  "common/has_parent",
  "common/continuum_view",
  "./volumeslicertemplate",
  "jquery_ui/slider",
], (HasParent, ContinuumView, template, slider) ->

  class VolumeSlicerView extends ContinuumView.View
    template : template
    initialize : (options) ->
      super(options)
      @plot = @mget_obj('main_plot')
      @plot_view = new @plot.default_view('model' : @plot)
      @vert_plot = @mget_obj('vert_plot')
      @vert_plot_view = new @plot.default_view('model' : @vert_plot)
      @horiz_plot = @mget_obj('horiz_plot')
      @horiz_plot_view = new @plot.default_view('model' : @horiz_plot)
      @render()
      @listenTo(@plot_view.y_range, 'change', @auto_y_slider_bounds)
      @listenTo(@plot_view.x_range, 'change', @auto_x_slider_bounds)
      return @

    z_slider_bounds : (min, max) ->
      @$el.find(".app_slider").slider(
        min: min
        max: max
        step: (max - min) / 50.0 ,
        value: min
      )
    y_slider_bounds : (min, max) ->
      @$el.find(".vert_slider").slider(
        min: min
        max: max
        step: (max - min) / 50.0 ,
        value: (min + max)/2
      )
    x_slider_bounds : (min, max) ->
      @$el.find(".horiz_slider").slider(
        min: min
        max: max
        step: (max - min) / 50.0 ,
        value: (min + max)/2
      )
    auto_x_slider_bounds : () =>
      end = @plot_view.x_range.get('end')
      start = @plot_view.x_range.get('start')
      remote = @mget_obj('server_data_source')
      global_x_range = remote.get('data').global_x_range
      global_start = global_x_range[0]
      global_end = global_x_range[1]
      min = @x_slice_max * (start - global_start) / (global_end - global_start)
      max = @x_slice_max * (end - global_start) / (global_end - global_start)
      console.log('x slider bonds', min, max)
      @x_slider_bounds(min, max)
      @x_slide((min + max)/2)

    auto_y_slider_bounds : () =>
      end = @plot_view.y_range.get('end')
      start = @plot_view.y_range.get('start')
      remote = @mget_obj('server_data_source')
      global_y_range = remote.get('data').global_y_range
      global_start = global_y_range[0]
      global_end = global_y_range[1]
      min = @y_slice_max * (start - global_start) / (global_end - global_start)
      max = @y_slice_max * (end - global_start) / (global_end - global_start)
      console.log('y slider bonds', min, max)
      @y_slider_bounds(min, max)
      @y_slide((min+ max)/2)
    y_slide :  (value) ->
        remote = @mget_obj('horiz_source')
        current_slice = remote.get('index_slice')
        new_slice = (x for x in current_slice)
        new_slice[0] = Math.round(value)
        remote.set('index_slice', new_slice)

    x_slide : (value) ->
        remote = @mget_obj('vert_source')
        current_slice = remote.get('index_slice')
        new_slice = (x for x in current_slice)
        new_slice[1] = Math.round(value)
        remote.set('index_slice', new_slice)

    render : () ->
      super()
      @plot_view.$el.detach()
      @$el.html('')
      @$el.html(@template())
      @$(".main_plot").append(@plot_view.$el)
      @$(".vert_plot").append(@vert_plot_view.$el)
      @$(".horiz_plot").append(@horiz_plot_view.$el)
      @z_slice_max = @mget('shape')[2]
      @z_slice_min = 0
      @y_slice_max = @mget('shape')[0]
      @y_slice_min = 0
      @x_slice_max = @mget('shape')[1]
      @x_slice_min = 0
      @$el.find(".app_slider").slider(
        orientation: "vertical",
        animate: "fast",
        slide: ( event, ui ) =>
          remote = @mget_obj('server_data_source')
          current_slice = remote.get('index_slice')
          new_slice = (x for x in current_slice)
          new_slice[2] = Math.round(ui.value)
          remote.set('index_slice', new_slice)
      )
      @z_slider_bounds(@z_slice_min, @z_slice_max)
      @$el.find(".vert_slider").slider(
        orientation: "vertical",
        animate: "fast",
        slide: (event, ui) => @y_slide(ui.value)
      )
      #@y_slider_bounds(@y_slice_min, @y_slice_max)
      @auto_y_slider_bounds()
      @$el.find(".horiz_slider").slider(
        orientation: "horizontal",
        animate: "fast",
        slide: (event, ui) => @x_slide(ui.value)
      )
      @x_slider_bounds(@x_slice_min, @x_slice_max)

  class VolumeSlicer extends HasParent
    type : "VolumeSlicer"
    default_view : VolumeSlicerView

  class VolumeSlicers extends Backbone.Collection
    model: VolumeSlicer

  return {
    "Model": VolumeSlicer
    "Collection": new VolumeSlicers()
    "View" : VolumeSlicerView
  }
