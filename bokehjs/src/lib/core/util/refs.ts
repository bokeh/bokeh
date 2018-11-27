import {HasProps} from "../has_props"
import {Attrs} from "../types"
import {isObject} from "./types"

export interface Ref {
  id: string
  type: string
  subtype?: string
  attributes: Attrs
}

export interface Ptr {
  id: string
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
    attributes: {},
  }
  if (obj._subtype != null) {
    ref.subtype = obj._subtype
  }
  return ref
}

// Determine whether an object has the proper format of a Bokeh reference
//
// @param arg [Object] the object to test
// @return [bool] whether the object is a reference
//
// @note this function does not check that the id and types are valid,
//   only that the format is correct (all required keys are present)
//
export function is_ptr(arg: unknown): arg is Ptr {
  if (isObject(arg)) {
    const keys = Object.keys(arg)
    return keys.length == 1 && keys[0] == "id"
  }
  return false
}
