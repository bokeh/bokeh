import {Model} from "../model"
import * as kinds from "core/kinds"
import type {HasProps} from "core/has_props"
import type {AnyVal} from "core/serialization"
import type {Deserializer} from "core/serialization/deserializer"
import type {Ref} from "core/util/refs"
import {isString} from "core/util/types"
import {to_object} from "core/util/object"

export type ModelDef = {
  type: "model"
  name: string
  extends?: Ref
  properties?: PropertyDef[]
  overrides?: OverrideDef[]
}

export type PrimitiveKindRef = "Any" | "Unknown" | "Bool" | "Float" | "Int" | "Bytes" | "Str" | "Null"

export type KindRef =
  PrimitiveKindRef |
  ["Regex", string, string?] |
  ["Nullable", KindRef] |
  ["Or", KindRef, ...KindRef[]] |
  ["Tuple", KindRef, ...KindRef[]] |
  ["List", KindRef] |
  ["Struct", ...([string, KindRef][])] |
  ["Dict", KindRef] |
  ["Mapping", KindRef, KindRef] |
  ["Enum", ...string[]] |
  ["Ref", Ref] |
  ["AnyRef"]

export type PropertyDef = {
  name: string
  kind: KindRef
  default?: unknown
}

export type OverrideDef = {
  name: string
  default: unknown
}

export function decode_def(def: ModelDef, deserializer: Deserializer): typeof HasProps {

  function kind_of(ref: KindRef): kinds.Kind<unknown> {
    if (isString(ref)) {
      switch (ref) {
        case "Any": return kinds.Any
        case "Unknown": return kinds.Unknown
        case "Bool": return kinds.Bool
        case "Float": return kinds.Float
        case "Int": return kinds.Int
        case "Bytes": return kinds.Bytes
        case "Str": return kinds.Str
        case "Null": return kinds.Null
      }
    } else {
      switch (ref[0]) {
        case "Regex": {
          const [, regex, flags] = ref
          return kinds.Regex(new RegExp(regex, flags))
        }
        case "Nullable": {
          const [, sub_ref] = ref
          return kinds.Nullable(kind_of(sub_ref))
        }
        case "Or": {
          const [, sub_ref, ...sub_refs] = ref
          return kinds.Or(kind_of(sub_ref), ...sub_refs.map(kind_of))
        }
        case "Tuple": {
          const [, sub_ref, ...sub_refs] = ref
          return kinds.Tuple(kind_of(sub_ref), ...sub_refs.map(kind_of))
        }
        case "List": {
          const [, sub_ref] = ref
          return kinds.List(kind_of(sub_ref))
        }
        case "Struct": {
          const [, ...entry_refs] = ref
          const entries: [string, kinds.Kind<unknown>][] = entry_refs.map(([key, val_ref]) => [key, kind_of(val_ref)])
          return kinds.Struct(to_object(entries))
        }
        case "Dict": {
          const [, val_ref] = ref
          return kinds.Dict(kind_of(val_ref))
        }
        case "Mapping": {
          const [, key_ref, val_ref] = ref
          return kinds.Mapping(kind_of(key_ref), kind_of(val_ref))
        }
        case "Enum": {
          const [, ...items] = ref
          return kinds.Enum(...items)
        }
        case "Ref": {
          const [, model_ref] = ref
          const model = deserializer.resolver.get(model_ref.id)
          if (model != null) {
            return kinds.Ref(model)
          } else {
            throw new Error(`${model_ref.id} wasn't defined before referencing it`)
          }
        }
        case "AnyRef": {
          return kinds.AnyRef()
        }
      }
    }
  }

  const base: typeof HasProps = (() => {
    const name = def.extends?.id ?? "Model"
    if (name == "Model") {
      // TODO: support base classes in general
      return Model
    }
    const base = deserializer.resolver.get(name)
    if (base != null) {
      return base
    } else {
      throw new Error(`base model ${name} of ${def.name} is not defined`)
    }
  })()

  const model = class extends base {
    static override __qualified__ = def.name
  }

  function decode(value: unknown): unknown {
    if (value === undefined) {
      return value
    } else {
      return deserializer.decode(value as AnyVal)
    }
  }

  for (const prop of def.properties ?? []) {
    const kind = kind_of(prop.kind)
    model.define<any>({[prop.name]: [kind, decode(prop.default)]})
  }

  for (const prop of def.overrides ?? []) {
    model.override<any>({[prop.name]: decode(prop.default)})
  }

  deserializer.resolver.register(model)
  return model
}
