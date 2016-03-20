$ = require "jquery"
_ = require "underscore"

RemoteDataSource = require "./remote_data_source"
{logger} = require "../../core/logging"
p = require "../../core/properties"

class AjaxDataSource extends RemoteDataSource.Model
  type: 'AjaxDataSource'

  @define {
      mode:         [ p.String, 'replace'          ]
      content_type: [ p.String, 'application/json' ]
      http_headers: [ p.Any,    {}                 ] # TODO (bev)
      max_size:     [ p.Number                     ]
      method:       [ p.String, 'POST'             ] # TODO (bev)  enum?
      if_modified:  [ p.Bool,   false              ]
    }

  destroy : () =>
    if @interval?
      clearInterval(@interval)

  setup : (plot_view, glyph) =>
    @pv = plot_view
    @get_data(@get('mode'))
    if @get('polling_interval')
      @interval = setInterval(@get_data, @get('polling_interval'),
                              @get('mode'), @get('max_size'),
                              @get('if_modified'))

  get_data : (mode, max_size=0, if_modified=false) =>
    $.ajax(
      dataType: 'json'
      ifModified: if_modified
      url : @get('data_url')
      xhrField :
        withCredentials : true
      method : @get('method')
      contentType : @get('content_type')
      headers : @get('http_headers')
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

module.exports =
  Model: AjaxDataSource
