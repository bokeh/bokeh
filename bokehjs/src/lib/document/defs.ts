import {Model} from "../model"
import * as kinds from "../core/kinds"
import {type HasProps} from "core/has_props"
import {AnyVal} from "core/serialization"
import {Deserializer} from "core/serialization/deserializer"
import {Ref} from "core/util/refs"
import {isString} from "core/util/types"
import {to_object} from "core/util/object"

export type ModelDef = {
  type: "model"
  name: string
  extends?: Ref
  properties?: PropertyDef[]
  overrides?: OverrideDef[]
}

export type PrimitiveKindRef = "Any" | "Unknown" | "Boolean" | "Number" | "Int" | "Bytes" | "String" | "Null"

export type KindRef =
  PrimitiveKindRef |
  ["Regex", string, string?] |
  ["Nullable", KindRef] |
  ["Or", KindRef, ...KindRef[]] |
  ["Tuple", KindRef, ...KindRef[]] |
  ["Array", KindRef] |
  ["Struct", ...([string, KindRef][])] |
  ["Dict", KindRef] |
  ["Map", KindRef, KindRef] |
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
        case "Boolean": return kinds.Boolean
        case "Number": return kinds.Number
        case "Int": return kinds.Int
        case "Bytes": return kinds.Bytes
        case "String": return kinds.String
        case "Null": return kinds.Null
      }
    } else {
      switch (ref[0]) {
        case "Regex": {
          const [, regex, flags] = ref
          return kinds.Regex(new RegExp(regex, flags))
        }
        case "Nullable": {
          const [, subref] = ref
          return kinds.Nullable(kind_of(subref))
        }
        case "Or": {
          const [, subref, ...subrefs] = ref
          return kinds.Or(kind_of(subref), ...subrefs.map(kind_of))
        }
        case "Tuple": {
          const [, subref, ...subrefs] = ref
          return kinds.Tuple(kind_of(subref), ...subrefs.map(kind_of))
        }
        case "Array": {
          const [, subref] = ref
          return kinds.Array(kind_of(subref))
        }
        case "Struct": {
          const [, ...entryrefs] = ref
          const entries: [string, kinds.Kind<unknown>][] = entryrefs.map(([key, valref]) => [key, kind_of(valref)])
          return kinds.Struct(to_object(entries))
        }
        case "Dict": {
          const [, valref] = ref
          return kinds.Dict(kind_of(valref))
        }
        case "Map": {
          const [, keyref, valref] = ref
          return kinds.Map(kind_of(keyref), kind_of(valref))
        }
        case "Enum": {
          const [, ...items] = ref
          return kinds.Enum(...items)
        }
        case "Ref": {
          const [, modelref] = ref
          const model = deserializer.resolver.get(modelref.id)
          if (model != null)
            return kinds.Ref(model)
          else
            throw new Error(`${modelref.id} wasn't defined before referencing it`)
        }
        case "AnyRef": {
          return kinds.AnyRef()
        }
      }
    }
  }

  const base: typeof HasProps = (() => {
    const name = def.extends?.id ?? "Model"
    if (name == "Model") // TODO: support base classes in general
      return Model
    const base = deserializer.resolver.get(name)
    if (base != null)
      return base
    else
      throw new Error(`base model ${name} of ${def.name} is not defined`)
  })()

  const model = class extends base {
    static override __qualified__ = def.name
  }

  function decode(value: unknown): unknown {
    if (value === undefined)
      return value
    else
      return deserializer.decode(value as AnyVal)
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
