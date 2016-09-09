_ = require "underscore"
Util = require "util/util"
Model = require "model"
p = require "core/properties"
popup_helper = require "./popup_helper"

class Popup extends Model
  type: "Popup"

  execute: (data_source) ->
    for i in Util.get_indices(data_source)
      message = Util.replace_placeholders(@message, data_source, i)
      popup_helper.popup(message)
    null

  @define {
    message: [ p.String, "" ]
  }

module.exports =
  Model: Popup
