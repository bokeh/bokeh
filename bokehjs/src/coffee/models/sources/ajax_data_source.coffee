import {RemoteDataSource} from "./remote_data_source"
import {logger} from "core/logging"
import * as p from "core/properties"

export class AjaxDataSource extends RemoteDataSource
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
                              @mode, @max_size, @if_modified)

  get_data : (mode, max_size=0, if_modified=false) =>
    xhr = new XMLHttpRequest()
    xhr.open(@method, @data_url, true)
    xhr.withCredentials = false
    xhr.setRequestHeader("Content-Type", @content_type)
    for name, value of @http_headers
      xhr.setRequestHeader(name, value)
    # TODO: if_modified
    xhr.addEventListener("load", () =>
      if xhr.status == 200
        data = JSON.parse(xhr.responseText)
        switch mode
          when 'replace'
            @data = data
          when 'append'
            original_data = @data
            for column in @columns()
              data[column] = original_data[column].concat(data[column])[-max_size..]
            @data = data
    )
    xhr.addEventListener("error", () =>
      logger.error("Failed to fetch JSON from #{@data_url} with code #{xhr.status}")
    )
    xhr.send()
    return null
