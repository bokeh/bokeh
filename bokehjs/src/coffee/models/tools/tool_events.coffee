import * as _ from "underscore"
import * as Model from "../../model"
{logger} = require "../../core/logging"
import * as p from "../../core/properties"

class ToolEvents extends Model
  type: 'ToolEvents'

  @define {
    geometries: [ p.Array, [] ]
  }

module.exports =
  Model: ToolEvents
