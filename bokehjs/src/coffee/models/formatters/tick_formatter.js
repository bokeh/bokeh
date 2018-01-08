import {Model} from "../../model"

export class TickFormatter extends Model
  type: 'TickFormatter'

  doFormat: (ticks, axis) ->
