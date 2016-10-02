_ = require "underscore"

Model = require "../../model"
p = require "../../core/properties"
{replace_placeholders} = require "../../core/util/templating"
Util = require "../../util/util"

class OpenURL extends Model
  type: 'OpenURL'

  @define {
      url: [ p.String, 'http://' ] # TODO (bev) better type
    }

  execute: (data_source) ->
    for i in Util.get_indices(data_source)
      url = replace_placeholders(@url, data_source, i)
      window.open(url)
    null

module.exports =
  Model: OpenURL
