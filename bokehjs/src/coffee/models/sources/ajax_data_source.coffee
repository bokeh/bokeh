import * as $ from "jquery"
import * as _ from "underscore"

import * as RemoteDataSource from "./remote_data_source"
{logger} = require "../../core/logging"
import * as p from "../../core/properties"

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
    @get_data(@mode)
    if @polling_interval
      @interval = setInterval(@get_data, @polling_interval,
                              @mode, @max_size,
                              @if_modified)

  get_data : (mode, max_size=0, if_modified=false) =>
    $.ajax(
      dataType: 'json'
      ifModified: if_modified
      url : @data_url
      xhrField :
        withCredentials : true
      method : @method
      contentType : @content_type
      headers : @http_headers
    ).done((data) =>
      if mode == 'replace'
        @data = data
      else if mode == 'append'
        original_data = @data
        for column in @columns()
          data[column] = original_data[column].concat(data[column])[-max_size..]
        @data = data
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
