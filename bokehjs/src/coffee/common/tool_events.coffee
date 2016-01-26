_ = require "underscore"
Model = require "../model"
{logger} = require "./logging"

class ToolEvents extends Model
  type: 'ToolEvents'

  defaults: () ->
    return _.extend {}, super(), {
      geometries: []
    }

module.exports =
  Model: ToolEvents
