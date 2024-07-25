import type {Attrs} from "../types"
import {isPlainObject, isObject} from "./types"

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

export const has_refs = Symbol("has_refs")

export interface HasRefs {
  readonly [has_refs]: boolean
}

function _is_HasRefs(v: object): v is HasRefs {
  return has_refs in v
}

export function is_HasRefs(v: unknown): v is HasRefs {
  return isObject(v) && _is_HasRefs(v)
}

export function may_have_refs(obj: object): boolean {
  if (_is_HasRefs(obj)) {
    return obj[has_refs]
  }
  const type = obj.constructor
  if (is_HasRefs(type)) {
    return type[has_refs]
  }
  return true
}
