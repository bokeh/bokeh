import {Transform} from "./transform"
import * as p from "core/properties"

export class Dodge extends Transform
  @define {
    value: [ p.Number,  0 ]
    range: [ p.Instance   ]
  }

  compute: (x, use_synthetic=true) ->
    if @range?.synthetic? and use_synthetic
      x = @range.synthetic(x)
    return x + @value
