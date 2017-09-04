import {Model} from "../../model"
import * as p from "core/properties"

export class Namespace extends Model
  type: "Namespace"

  @define {
    vars: [ p.Any, {} ] # Dict(String, Any)
  }
