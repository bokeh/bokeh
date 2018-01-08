import {Model} from "../../model"
import * as p from "core/properties"
import {get_indices} from "core/util/selection"
import {replace_placeholders} from "core/util/templating"

export class OpenURL extends Model
  type: 'OpenURL'

  @define {
    url: [ p.String, 'http://' ] # TODO (bev) better type
  }

  execute: (cb_obj, cb_data) ->
    for i in get_indices(cb_data.source)
      url = replace_placeholders(@url, cb_data.source, i)
      window.open(url)
    null
