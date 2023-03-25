import {Attrs} from "../types"
import {isPlainObject} from "./types"

export type Struct = {
  id: string
  type: string
  attributes: Attrs
}

export type Ref = {
  id: string
}

export function is_ref(obj: unknown): obj is Ref {
  return isPlainObject(obj) && "id" in obj && !("type" in obj)
}
