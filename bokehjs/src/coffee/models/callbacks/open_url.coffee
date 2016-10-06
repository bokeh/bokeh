import * as _ from "underscore"

import * as Model from "../../model"
import * as p from "../../core/properties"
{get_indices} = require "../../core/util/selection"
{replace_placeholders} = require "../../core/util/templating"

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

module.exports =
  Model: OpenURL
