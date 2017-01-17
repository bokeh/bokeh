import {Model} from "model"
import * as p from "core/properties"
import {get_indices} from "core/util/selection"
import {replace_placeholders} from "core/util/templating"
import {popup} from "./popup_helper"

export class Popup extends Model
  type: "Popup"

  execute: (data_source) ->
    for i in get_indices(data_source)
      message = replace_placeholders(@message, data_source, i)
      popup(message)
    null

  @define {
    message: [ p.String, "" ]
  }
