import * as _ from "underscore"

import * as Model from "../../model"
import * as p from "../../core/properties"
import {get_indices} from "../../core/util/selection"
import {replace_placeholders} from "../../core/util/templating"

class OpenURL extends Model
  type: 'OpenURL'

  @define {
      url: [ p.String, 'http://' ] # TODO (bev) better type
    }

  execute: (data_source) ->
    for i in get_indices(data_source)
      url = replace_placeholders(@url, data_source, i)
      window.open(url)
    null

export {
  OpenURL as Model
}
