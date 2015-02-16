define [
  "underscore"
  "backbone"
  "common/logging"
  "./remote_data_source"
], (_, Backbone, Logging, RemoteDataSource) ->

  logger = Logging.logger

  #maybe generalize to ajax data source later?
  class AjaxDataSource extends RemoteDataSource.RemoteDataSource
    type: 'AjaxDataSource'
    destroy : () =>
      if @interval?
        clearInterval(@interval)

    setup : (plot_view, glyph) =>
      @pv = plot_view
      @get_data(true)
      if @get('polling_interval')
        @interval = setInterval( @get_data, @get('polling_interval'), @get('overwrite'), @get('max_size'))

    get_data : (overwrite, max_size=0) =>
      $.ajax(
        dataType: 'json'
        ifModified: true
        url : @get('data_url')
        xhrField :
          withCredentials : true
        method : @get('method')
        contentType : 'application/json'
      ).done((data) =>
        if overwrite == true
          @set('data', data)
        else
          original_data = @get('data')
          data.x = original_data.x.concat(data.x)[-max_size..]
          data.y = original_data.y.concat(data.y)[-max_size..]
          @set('data', data)
        console.log(data)
        return null
      ).error(() =>
        console.log(arguments)
      )
      return null

  class AjaxDataSources extends Backbone.Collection
    model: AjaxDataSource
    defaults:
      url : ""
      expr : null

  return {
    "Model": AjaxDataSource
    "Collection": new AjaxDataSources()
  }
