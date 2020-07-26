import {describe, it} from "../framework"
export * from "../framework"

import {expect} from "../unit/assertions"

import all_defaults from "../.generated_defaults/defaults.json"

import {isArray, isPlainObject} from "@bokehjs/core/util/types"
import {difference} from "@bokehjs/core/util/array"
import {keys, values, entries} from "@bokehjs/core/util/object"
import {isEqual} from "@bokehjs/core/util/eq"

import {Models} from "@bokehjs/base"
import {HasProps} from "@bokehjs/core/has_props"

import "@bokehjs/models/widgets/main"
import "@bokehjs/models/widgets/tables/main"

function get_defaults(name: string) {
  const defaults = all_defaults[name]
  if (defaults != null)
    return defaults
  else
    throw new Error(`can't find defaults for ${name}`)
}

function safe_stringify(v: unknown): string {
  if (v === Infinity) {
    return "Infinity"
  } else {
    try {
      return JSON.stringify(v)
    } catch {
      return `${v}`
    }
  }
}

function deep_value_to_serializable(_key: string, value: any, _optional_parent_object: any): any {
  if (value instanceof HasProps) {
    return {type: value.type, attributes: value.attributes_as_json()}
  } else if (isArray(value)) {
    const ref_array: any[] = []
    for (let i = 0; i < value.length; i++) {
      ref_array.push(deep_value_to_serializable(i.toString(), value[i], value))
    }
    return ref_array
  } else if (isPlainObject(value)) {
    const ref_obj: {[key: string]: any} = {}
    for (const [subkey, subvalue] of entries(value)) {
      ref_obj[subkey] = deep_value_to_serializable(subkey, subvalue, value)
    }
    return ref_obj
  } else
    return value
}

type KV = {[key: string]: any}

function check_matching_defaults(name: string, python_defaults: KV, bokehjs_defaults: KV): boolean {
  const different: string[] = []
  const python_missing: string[] = []
  const bokehjs_missing: string[] = []

  for (const [k, js_v] of entries(bokehjs_defaults)) {
    // special case for graph renderer node_renderer
    if (name === "GraphRenderer" && k === "node_renderer")
      continue

    // special case for graph renderer node_renderer
    if (name === "GraphRenderer" && k === "edge_renderer")
      continue

    // special case for date picker, default is "now"
    if (name === 'DatePicker' && k === 'value')
      continue

    // special case for date time tickers, class hierarchy and attributes are handled differently
    if (name === "DatetimeTicker" && k === "tickers")
      continue

    // special case for Title derived text properties
    if (name === "Title" && (k === "text_align" || k === "text_baseline"))
      continue

    if (name == "DateSlider" && (k == "start" || k == "end" || k == "value" || k == "value_throttled"))
      continue

    if (name == "DateRangeSlider" && (k == "start" || k == "end"))
      continue

    if (k === 'id')
      continue

    if (k in python_defaults) {
      let py_v = python_defaults[k]
      strip_ids(py_v)

      if (!isEqual(py_v, js_v)) {

        // these two conditionals compare 'foo' and {value: 'foo'}
        if (isPlainObject(js_v) && 'value' in js_v && isEqual(py_v, js_v.value))
          continue
        if (isPlainObject(py_v) && 'value' in py_v && isEqual(py_v.value, js_v))
          continue

        if (isPlainObject(js_v) && 'attributes' in js_v && isPlainObject(py_v) && 'attributes' in py_v) {
          if (js_v.type === py_v.type) {
            check_matching_defaults(`${name}.${k}`, py_v.attributes as KV, js_v.attributes as KV)
            continue
          }
        }

        // compare arrays of objects
        if (isArray(js_v) && isArray(py_v)) {
          let equal = true

          // palettes in JS are stored as int color values
          if (k === 'palette')
            py_v = py_v.map((x: string) => parseInt(x.slice(1), 16))

          if (js_v.length !== py_v.length)
            equal = false
          else {
            for (let i = 0; i < js_v.length; i++) {
              delete (js_v[i] as any).id
              delete (py_v[i] as any).id
              if (!isEqual(js_v[i], py_v[i])) {
                equal = false
                break
              }
            }
          }

          if (equal)
            continue
        }

        different.push(`${name}.${k}: bokehjs defaults to ${safe_stringify(js_v)} but python defaults to ${safe_stringify(py_v)}`)
      }
    } else {
      python_missing.push(`${name}.${k}: bokehjs defaults to ${safe_stringify(js_v)} but python has no such property`)
    }
  }

  for (const [k, v] of entries(python_defaults)) {
    if (!(k in bokehjs_defaults)) {
      bokehjs_missing.push(`${name}.${k}: python defaults to ${safe_stringify(v)} but bokehjs has no such property`)
    }
  }

  function complain(failures: string[], message: string): void {
    if (failures.length > 0) {
      console.error(message)
      for (const f of failures)
        console.error(`    ${f}`)
    }
  }

  complain(different, `${name}: defaults are out of sync between Python and bokehjs`)
  complain(python_missing, `${name}: python is missing some properties found in bokehjs`)
  complain(bokehjs_missing, `${name}: bokehjs is missing some properties found in Python`)

  return different.length === 0 && python_missing.length === 0 && bokehjs_missing.length === 0
}

function strip_ids(value: any): void {
  if (isArray(value)) {
    for (const v of value) {
      strip_ids(v)
    }
  } else if (isPlainObject(value)) {
    if ('id' in value) {
      delete value.id
    }
    for (const v of values(value)) {
      strip_ids(v)
    }
  }
}

describe("Defaults", () => {

  it("have all view models from Python in registered locations", () => {
    const registered: {[key: string]: boolean} = {}
    for (const name of Models.registered_names()) {
      registered[name] = true
    }
    const missing = []
    const all_view_model_names = keys(all_defaults)
    for (const name of all_view_model_names) {
      if (!(name in registered)) {
        missing.push(name)
      }
    }
    for (const m of missing) {
      console.error(`'base.locations["${m}"]' not found but there's a Python model '${m}'`)
    }
    expect(missing.length).to.be.equal(0)
  })

  it("match between Python and bokehjs", () => {
    let fail_count = 0
    const all_view_model_names = keys(all_defaults)
    for (const name of all_view_model_names) {
      const model = Models(name)
      const attrs: {[key: string]: unknown} = {}
      for (const [attr, prop] of Object.entries(model.prototype._props)) {
        if (prop.options?.internal !== true) {
          const value = prop.default_value != null ? prop.default_value() : null // XXX: non-nullable properties
          attrs[attr] = deep_value_to_serializable(attr, value, undefined)
        }
      }

      const python_defaults = get_defaults(name)
      const bokehjs_defaults = attrs
      if (!check_matching_defaults(name, python_defaults, bokehjs_defaults)) {
        console.error(name)
        console.error(difference(keys(python_defaults), keys(bokehjs_defaults)))
        fail_count += 1
      }
    }

    console.error(`Python/bokehjs matching defaults problems: ${fail_count}`)
    expect(fail_count).to.be.equal(0)
  })
})
