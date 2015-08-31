$ = require "jquery"
_ = require "underscore"
HasProperties = require "../common/has_properties"

class ServerCallback extends HasProperties
  type: 'ServerCallback'

  initialize: (attrs, options) ->
    super(attrs, options)

  execute: (cb_obj, cb_data) ->
    prefix = @get_base().Config.prefix
    doc = @get('doc')
    if not doc?
      throw new Error("Unset 'doc' in " + this)
    id = @get('id')
    type = @type
    url = "#{prefix}bokeh/bb/execute/#{doc}/#{type}/#{id}"
    data =
      object: @convert_to_ref(cb_obj),
      data: cb_data
    resp = $.ajax(
      type: 'POST'
      url: url,
      data: JSON.stringify(data)
      contentType: 'application/json'
      xhrFields:
        withCredentials: true
    )
    return resp

  defaults: ->
    return _.extend {}, super(), {
    }

module.exports =
  Model: ServerCallback
