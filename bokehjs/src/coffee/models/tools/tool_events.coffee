import {Model} from "../../model"
import * as p from "core/properties"

export class ToolEvents extends Model
  type: 'ToolEvents'

  @define {
    geometries: [ p.Array, [] ]
  }
