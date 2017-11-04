import {Transform} from "../transforms"
import * as p from "core/properties"

export class Scale extends Transform

  @internal {
    source_range: [ p.Any ]
    target_range: [ p.Any ]
  }

  # TODO: add abstract methods
