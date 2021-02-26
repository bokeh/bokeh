import {Attrs} from "../types"
import {isPlainObject} from "./types"
import {keys} from "./object"

export type Struct = {
  id: string
  type: string
  subtype?: string
  attributes: Attrs
}

export type Ref = {
  id: string
}

// Determine whether an object has the proper format of a Bokeh reference
//
// @param arg [Object] the object to test
// @return [bool] whether the object is a reference
//
// @note this function does not check that the id and types are valid,
//   only that the format is correct (all required keys are present)
//
export function is_ref(arg: unknown): arg is Ref {
  if (isPlainObject(arg)) {
    const attrs = keys(arg)
    return attrs.length == 1 && attrs[0] == "id"
  }
  return false
}
