import {LinearScale} from "./linear_scale"

export class CategoricalScale extends LinearScale
  type: "CategoricalScale"

  compute: (x) ->
    return super(@source_range.synthetic(x))

  v_compute: (xs) ->
    return super(@source_range.v_synthetic(xs))
