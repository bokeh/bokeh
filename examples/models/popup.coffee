_ = require "underscore"
Model = require "model"
p = require "core/properties"
{get_indices} = require "core/util/selection"
{replace_placeholders} = require "core/util/templating"
popup_helper = require "./popup_helper"

class Popup extends Model
  type: "Popup"

  execute: (data_source) ->
    for i in get_indices(data_source)
      message = replace_placeholders(@message, data_source, i)
      popup_helper.popup(message)
    null

  @define {
    message: [ p.String, "" ]
  }

module.exports =
  Model: Popup
