_ = require "underscore"
Model = require "../model"
{logger} = require "../core/logging"
p = require "../core/properties"

class ToolEvents extends Model
  type: 'ToolEvents'

  @define {
    geometries: [ p.Array, [] ]
  }

module.exports =
  Model: ToolEvents
