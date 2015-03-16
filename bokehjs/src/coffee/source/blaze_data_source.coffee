define [
  "jquery"
  "underscore"
  "backbone"
  "common/logging"
  "./remote_data_source"
], ($, _, Backbone, Logging, RemoteDataSource) ->

  logger = Logging.logger

  class BlazeDataSource extends RemoteDataSource.RemoteDataSource
    type: 'BlazeDataSource'
    destroy : () =>
      if @interval?
        clearInterval(@interval)

    setup : (plot_view, glyph) =>
      @pv = plot_view
      @update()
      if @get('polling_interval')
        @interval = setInterval(@update, @get('polling_interval'))

    update : () =>
      data = JSON.stringify(
        expr : @get('expr')
        namespace : @get('namespace')
      )
      $.ajax(
        dataType: 'json'
        url : @get('data_url')
        data : data
        xhrField :
          withCredentials : true
        method : 'POST'
        contentType : 'application/json'
      ).done((data) =>
        columns_of_data = _.zip.apply(_, data.data)
        data_dict = {}
        for colname, idx in data.names
          data_dict[colname] = columns_of_data[idx]
        orig_data = _.clone(@get('data'))
        _.extend(orig_data, data_dict)
        @set('data', orig_data)
        return null
      )

  class BlazeDataSources extends Backbone.Collection
    model: BlazeDataSource
    defaults:
      url : ""
      expr : null

  return {
    "Model": BlazeDataSource,
    "Collection": new BlazeDataSources()
  }
