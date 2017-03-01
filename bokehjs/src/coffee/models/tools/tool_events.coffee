import {Model} from "../../model"
import {logger} from "core/logging"
import * as p from "core/properties"

export class ToolEvents extends Model
  type: 'ToolEvents'

  @define {
    geometries: [ p.Array, [] ]
  }
