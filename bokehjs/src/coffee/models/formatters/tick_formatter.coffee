_ = require "underscore"

Model = require "../../model"

class TickFormatter extends Model
  type: 'TickFormatter'

  doFormat: (ticks) ->

module.exports =
  Model: TickFormatter
