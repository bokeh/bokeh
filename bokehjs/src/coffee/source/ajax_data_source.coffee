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
      @update()
      if @get('polling_interval')
        @interval = setInterval(@update, @get('polling_interval'))

    update : () =>
      $.ajax(
        dataType: 'json'
        url : @get('data_url')
        xhrField :
          withCredentials : true
        method : @get('method')
        contentType : 'application/json'
      ).done((data) =>
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
