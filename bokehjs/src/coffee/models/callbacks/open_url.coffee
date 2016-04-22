_ = require "underscore"

p = require "../../core/properties"
Model = require "../../model"
Util = require "../../util/util"

class OpenURL extends Model
  type: 'OpenURL'

  @define {
      url: [ p.String, 'http://' ] # TODO (bev) better type
    }

  execute: (data_source) ->
    for i in Util.get_indices(data_source)
      url = Util.replace_placeholders(@get("url"), data_source, i)
      window.open(url)
    null

module.exports =
  Model: OpenURL
