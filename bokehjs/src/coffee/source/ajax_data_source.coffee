$ = require "jquery"
_ = require "underscore"
Backbone = require "backbone"
{logger} = require "../common/logging"
RemoteDataSource = require "./remote_data_source"

#maybe generalize to ajax data source later?
class AjaxDataSource extends RemoteDataSource.RemoteDataSource
  type: 'AjaxDataSource'
  destroy : () ->
    if @interval?
      clearInterval(@interval)

  setup : (plot_view, glyph) ->
    @pv = plot_view
    @get_data(@get('mode'))
    if @get('polling_interval')
      @interval = setInterval(((mode, max_size, if_modified) =>
                                @get_data(mode, max_size, if_modified)),
                              @get('polling_interval'),
                              @get('mode'), @get('max_size'),
                              @get('if_modified'))

  get_data : (mode, max_size=0, if_modified=false) ->
    $.ajax(
      dataType: 'json'
      ifModified: if_modified
      url : @get('data_url')
      xhrField :
        withCredentials : true
      method : @get('method')
      contentType : 'application/json'
    ).done((data) =>
      if mode == 'replace'
        @set('data', data)
      else if mode == 'append'
        original_data = @get('data')
        for column in @columns()
          data[column] = original_data[column].concat(data[column])[-max_size..]
        @set('data', data)
      else
        logger.error("unsupported mode: " + mode)
      logger.trace(data)
      return null
    ).error(() ->
      logger.error(arguments)
    )
    return null

  defaults: ->
    return _.extend {}, super(), {
      mode: 'replace'
    }

class AjaxDataSources extends Backbone.Collection
  model: AjaxDataSource
  defaults:
    url : ""
    expr : null

module.exports =
  Model: AjaxDataSource
  Collection: new AjaxDataSources()
