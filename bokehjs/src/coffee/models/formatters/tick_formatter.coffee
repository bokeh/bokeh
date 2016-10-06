import * as _ from "underscore"

import * as Model from "../../model"

class TickFormatter extends Model
  type: 'TickFormatter'

  doFormat: (ticks) ->

module.exports =
  Model: TickFormatter
