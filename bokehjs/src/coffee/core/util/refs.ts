import {HasProps} from "../has_props"
import {isObject} from "./types"

export interface Ref {
  id: string
  type: string
  subtype?: string
  attributes?: {[key: string]: any}
}

// Create a Bokeh reference from a HasProps subclass
//
// @param obj [HasProps] the object to create a reference for
// @return [Object] a Bokeh reference for `obj`
// @throw Error if `obj` is not a HasProps
//
export function create_ref(obj: HasProps): Ref {
  const ref: Ref = {
    type: obj.type,
    id: obj.id,
  }
  if (obj._subtype != null) {
    ref.subtype = obj._subtype
  }
  return ref
}

// Determine whether an object has the proper format of a Bokeh reference
//
// @param arg [Object] the object to test
// @return [bool] whether the object is a refererence
//
// @note this function does not check that the id and types are valid,
//   only that the format is correct (all required keys are present)
//
export function is_ref(arg: any): arg is Ref {
  if (isObject(arg)) {
    const keys = Object.keys(arg).sort()
    if (keys.length == 2)
      return keys[0] == 'id' && keys[1] == 'type'
    if (keys.length == 3)
      return keys[0] == 'id' && keys[1] == 'subtype' && keys[2] == 'type'
  }
  return false
}
