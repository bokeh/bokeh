import {ModelResolver} from "../base"
import {HasProps} from "./has_props"
import {ID, Attrs, PlainObject} from "./types"
import {Struct, is_ref} from "./util/refs"
import {Buffers, is_NDArray_ref, decode_NDArray, NDArrayRef} from "./util/serialization"
import {ndarray} from "./util/ndarray"
import {values, entries} from "./util/object"
import {isArray, isPlainObject, isString, isNumber} from "./util/types"
import {type Document} from "document"

export type RefMap = Map<ID, HasProps>

type AnyVal = AnyRef
type AnyRef = NumberRef | ArrayRef | NDArrayRef | SetRef | MapRef

type NumberRef = {
  type: "number"
  value: number | "nan" | "-inf" | "+inf"
}

type ArrayRef = {
  type: "array"
  entries: AnyVal[]
}

type SetRef = {
  type: "map"
  entries: AnyVal[]
}

type MapRef = {
  type: "map"
  entries: [AnyVal, AnyVal][]
}

export class Deserializer {

  static decode(value: unknown, buffers: Buffers = new Map()): unknown {

    function decode(obj: unknown): unknown {
      if (isPlainObject(obj)) {
        if ("type" in obj) {
          switch (obj.type) {
            case "number": {
              if ("value" in obj) {
                const {value} = obj
                if (isString(value)) {
                  switch (value) {
                    case "nan":  return NaN
                    case "+inf": return +Infinity
                    case "-inf": return -Infinity
                  }
                } else if (isNumber(value))
                  return value
              }
            }
            case "array": {
              const decoded = []
              if ("entries" in obj && isArray(obj.entries)) {
                for (const entry of obj.entries) {
                  decoded.push(decode(entry))
                }
              }
              return decoded
            }
            case "ndarray": {
              const {buffer, dtype, shape} = decode_NDArray(obj as NDArrayRef, buffers)
              return ndarray(buffer, {dtype, shape})
            }
            case "set": {
              const decoded = new Set()
              if ("entries" in obj && isArray(obj.entries)) {
                for (const entry of obj.entries) {
                  decoded.add(decode(entry))
                }
              }
              return decoded
            }
            case "map": {
              const decoded = new Map()
              if ("entries" in obj && isArray(obj.entries)) {
                for (const entry of obj.entries) {
                  if (isArray(entry) && entry.length == 2) {
                    const [k, v] = entry
                    decoded.set(decode(k), decode(v))
                  } else
                    throw new Error(`invalid entry when decoding an object of type '${obj.type}'`)
                }
              }
              return decoded
            }
          }
          if ("attributes" in obj)
            return obj // TODO: for now resolved later
          else
            throw new Error(`unable to decode an object of type '${obj.type}'`)
        } else {
          const decoded: PlainObject = {}
          for (const [k, v] of entries(obj)) {
            decoded[k] = decode(v)
          }
          return decoded
        }
      } else if (isArray(obj)) {
        const decoded: unknown[] = []
        for (const v of obj) {
          decoded.push(decode(v))
        }
        return decoded
      } else
        return obj
    }

    return decode(value)
  }

  static _instantiate_object(id: string, type: string, resolver: ModelResolver): HasProps {
    const model = resolver.get(type)
    return new (model as any)({id})
  }

  // given a JSON representation of all models in a graph, return a
  // dict of new model objects
  static _instantiate_references_json(references_json: Struct[], existing_models: RefMap, resolver: ModelResolver): RefMap {
    // Create all instances, but without setting their props
    const references = new Map()
    for (const obj of references_json) {
      const instance = existing_models.get(obj.id) ?? Deserializer._instantiate_object(obj.id, obj.type, resolver)
      references.set(instance.id, instance)
    }
    return references
  }

  // if v looks like a ref, or a collection, resolve it, otherwise return it unchanged
  // recurse into collections but not into HasProps
  static _resolve_refs(value: unknown, old_references: RefMap, new_references: RefMap, buffers: Buffers): unknown {
    function resolve_ref(v: unknown): unknown {
      if (is_ref(v)) {
        const obj = old_references.get(v.id) ?? new_references.get(v.id)
        if (obj != null)
          return obj
        else
          throw new Error(`reference ${JSON.stringify(v)} isn't known`)
      } else if (is_NDArray_ref(v)) {
        const {buffer, dtype, shape} = decode_NDArray(v, buffers)
        return ndarray(buffer, {dtype, shape})
      } else if (isArray(v))
        return resolve_array(v)
      else if (isPlainObject(v))
        return resolve_dict(v)
      else
        return v
    }

    function resolve_array(array: unknown[]) {
      const results: unknown[] = []
      for (const v of array) {
        results.push(resolve_ref(v))
      }
      return results
    }

    function resolve_dict(dict: PlainObject) {
      const resolved: PlainObject = {}
      for (const [k, v] of entries(dict)) {
        resolved[k] = resolve_ref(v)
      }
      return resolved
    }

    return resolve_ref(value)
  }

  // given a JSON representation of all models in a graph and new
  // model instances, set the properties on the models from the
  // JSON
  static _initialize_references_json(references_json: Struct[], old_references: RefMap, new_references: RefMap, buffers: Buffers, doc: Document | null): void {
    const to_update = new Map<ID, {instance: HasProps, is_new: boolean}>()

    for (const {id, attributes} of references_json) {
      const is_new = !old_references.has(id)
      const instance = is_new ? new_references.get(id)! : old_references.get(id)!

      // replace references with actual instances in obj_attrs
      const resolved_attrs = Deserializer._resolve_refs(attributes, old_references, new_references, buffers) as Attrs
      instance.setv(resolved_attrs, {silent: true})
      to_update.set(id, {instance, is_new})
    }

    const ordered_instances: HasProps[] = []
    const handled = new Set<ID>()

    function finalize_all_by_dfs(v: unknown): void {
      if (v instanceof HasProps) {
        // note that we ignore instances that aren't updated (not in to_update)
        if (to_update.has(v.id) && !handled.has(v.id)) {
          handled.add(v.id)

          const {instance, is_new} = to_update.get(v.id)!
          const {attributes} = instance

          for (const value of values(attributes)) {
            finalize_all_by_dfs(value)
          }

          if (is_new) {
            // Finalizing here just to avoid iterating
            // over `ordered_instances` twice.

            // finalize unset properties before this
            instance.finalize_props()
            if (doc != null)
              instance.attach_document(doc)
            instance.finalize()
            // Preserving an ordered collection of instances
            // to avoid having to go through DFS again.
            ordered_instances.push(instance)
          }
        }
      } else if (isArray(v)) {
        for (const e of v)
          finalize_all_by_dfs(e)
      } else if (isPlainObject(v)) {
        for (const value of values(v))
          finalize_all_by_dfs(value)
      }
    }

    for (const item of to_update.values()) {
      finalize_all_by_dfs(item.instance)
    }

    // `connect_signals` has to be executed last because it
    // may rely on properties of dependencies that are initialized
    // only in `finalize`. It's a problem that appears when
    // there are circular references, e.g. as in
    // CDS -> CustomJS (on data change) -> GlyphRenderer (in args) -> CDS.
    for (const instance of ordered_instances) {
      instance.connect_signals()
    }
  }
}
