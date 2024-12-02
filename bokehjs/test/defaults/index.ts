import {describe, it} from "../framework"
export * from "../framework"

import {ExpectationError} from "../unit/assertions"

import {HasProps} from "@bokehjs/core/has_props"
import {unset} from "@bokehjs/core/properties"
import {isString, isArray, isPlainObject} from "@bokehjs/core/util/types"
import {values, entries, dict} from "@bokehjs/core/util/object"
import {is_equal} from "@bokehjs/core/util/eq"
import {to_string} from "@bokehjs/core/util/pretty"
import {Serializer} from "@bokehjs/core/serialization"

import {default_resolver} from "@bokehjs/base"
import {settings} from "@bokehjs/core/settings"

import "@bokehjs/models/main"
import "@bokehjs/models/widgets/main"
import "@bokehjs/models/widgets/tables/main"

import json5 from "json5"

type KV<T = unknown> = {[key: string]: T}

import defaults_json5 from "./defaults.json5"

function _transform_defaults(obj: unknown): void {
  if (isPlainObject(obj)) {
    for (const val of values(obj)) {
      _transform_defaults(val)
    }
  } else if (isArray(obj)) {
    for (const item of obj) {
      _transform_defaults(item)
    }
  }
}

const raw_defaults = json5.parse(defaults_json5)
_transform_defaults(raw_defaults)

const all_defaults = dict<KV>(raw_defaults)

function _resolve_defaults(name: string, defaults: KV) {
  const {__extends__} = defaults
  delete defaults.__extends__

  const bases = (() => {
    if (isArray(__extends__)) {
      return __extends__ as string[]
    } else if (isString(__extends__)) {
      return [__extends__]
    } else if (__extends__ == null) {
      return []
    } else {
      throw new Error(`invalid __extends__: ${__extends__}`)
    }
  })()

  let new_defaults: KV = {}
  for (const base of bases) {
    const base_defaults = all_defaults.get(base)
    if (base_defaults != null) {
      new_defaults = {...new_defaults, ...resolve_defaults(base, base_defaults)}
    } else {
      throw new Error(`missing base: ${name} extends ${base}`)
    }
  }

  return {...new_defaults, ...defaults}
}

function resolve_defaults(name: string, defaults: KV) {
  if (!_resolved_names.has(name)) {
    const new_defaults = _resolve_defaults(name, defaults)
    all_defaults.set(name, new_defaults)
    _resolved_names.add(name)
    return new_defaults
  } else {
    return defaults
  }
}

const _resolved_names = new Set<string>()
for (const [name, defaults] of all_defaults) {
  resolve_defaults(name, defaults)
}

class DefaultsSerializer extends Serializer {

  override encode(obj: unknown): unknown {
    if (obj instanceof HasProps) {
      const attributes: KV<unknown> = {}
      for (const prop of obj) {
        if (prop.syncable) {
          const value = prop.is_unset ? unset : prop.get_value()
          attributes[prop.attr] = this.encode(value)
        }
      }

      const {type: name} = obj
      return {type: "object", name, attributes}
    } else {
      return super.encode(obj)
    }
  }
}

function get_defaults(name: string): KV {
  const defaults = all_defaults.get(name)
  if (defaults != null) {
    return defaults
  } else {
    throw new Error(`can't find defaults for ${name}`)
  }
}

function check_matching_defaults(context: string[], name: string, python_defaults: KV, bokehjs_defaults: KV): boolean {
  const different: string[] = []
  const python_missing: string[] = []
  const bokehjs_missing: string[] = []

  for (const [k, js_v] of entries(bokehjs_defaults)) {
    console.log(`${context.join(" -> ")} ${name}.${k}`)

    // node_renderer/edge_renderer are configured dynamically in bokehjs
    if (name == "GraphRenderer" && (k == "node_renderer" || k == "edge_renderer")) {
      continue
    }

    // special case for days/months/years tickers (null vs computed integer)
    if ((name == "DaysTicker" || name == "MonthsTicker" || name == "YearsTicker") && k == "interval") {
      continue
    }

    // if testing in dev mode, we use special platform independent "Bokeh" font, instead of the default
    if (settings.dev && k.includes("text_font") && (js_v == "Bokeh" || (js_v as any)?.value == "Bokeh")) {
      continue
    }

    if (k in python_defaults) {
      const py_v = (() => {
        const v = python_defaults[k]

        if (k == "palette" && isArray(v)) {
          return v.map((x) => parseInt((x as string).slice(1), 16))
        } else {
          return v
        }
      })()

      function is_object(obj: unknown): obj is {type: "object", name: string, attributes: KV} {
        return isPlainObject(obj) && obj.type == "object"
      }

      if (is_object(js_v) && is_object(py_v) && js_v.name == py_v.name) {
        const py_attrs = {...get_defaults(py_v.name), ...py_v.attributes}
        check_matching_defaults([...context, `${name}.${k}`], js_v.name, py_attrs, js_v.attributes)
        continue
      }

      // XXX: deal with the lack of scalar properties in bokeh
      function is_vector(obj: unknown): boolean {
        return isPlainObject(obj) && (obj.type == "value" || obj.type == "field" || obj.type == "expr")
      }

      if (is_vector(py_v) && !is_vector(js_v)) {
        if (is_equal(py_v, {type: "value", value: js_v})) {
          continue
        }
      } else if (!is_vector(py_v) && is_vector(js_v)) {
        if (is_equal({type: "value", value: py_v}, js_v)) {
          continue
        }
      }

      if (!is_equal(py_v, js_v)) {
        function compare_recursively(js_v: unknown, py_v: unknown): boolean {
          let equal = true

          if (isArray(js_v) && isArray(py_v)) {
            if (js_v.length != py_v.length) {
              equal = false
            } else {
              for (let i = 0; i < js_v.length; i++) {
                const js_vi = js_v[i]
                const py_vi = py_v[i]

                if (is_object(js_vi) && is_object(py_vi) && js_vi.name == py_vi.name) {
                  const py_attrs = {...get_defaults(py_vi.name), ...py_vi.attributes}
                  if (!check_matching_defaults([...context, `${name}.${k}[${i}]`], js_vi.name, py_attrs, js_vi.attributes)) {
                    equal = false
                    break
                  }
                } else if ((isArray(js_vi) && isArray(py_vi)) || (isPlainObject(js_vi) && isPlainObject(py_vi))) {
                  equal = compare_recursively(js_vi, py_vi)
                } else if (!is_equal(js_vi, py_vi)) {
                  equal = false
                  break
                }
              }
            }
          } else if (isPlainObject(js_v) && isPlainObject(py_v)) {
            const js_d = dict(js_v)
            const py_d = dict(py_v)

            if (!is_equal(new Set(js_d.keys()), new Set(py_d.keys()))) { // TODO can't compare objects of type [object Generator]
              equal = false
            } else {
              for (const key of js_d.keys()) {
                const js_vi = js_v[key]
                const py_vi = py_v[key]

                if (is_object(js_vi) && is_object(py_vi) && js_vi.name == py_vi.name) {
                  const py_attrs = {...get_defaults(py_vi.name), ...py_vi.attributes}
                  if (!check_matching_defaults([...context, `${name}.${k}[${key}]`], js_vi.name, py_attrs, js_vi.attributes)) {
                    equal = false
                    break
                  }
                } else if ((isArray(js_vi) && isArray(py_vi)) || (isPlainObject(js_vi) && isPlainObject(py_vi))) {
                  equal = compare_recursively(js_vi, py_vi)
                } else if (!is_equal(js_vi, py_vi)) {
                  equal = false
                  break
                }
              }
            }
          } else {
            equal = false
          }

          return equal
        }

        const equal = compare_recursively(js_v, py_v)
        if (equal) {
          continue
        }

        different.push(`${[...context, `${name}.${k}`].join(" -> ")}: bokehjs defaults to ${to_string(js_v)} but python defaults to ${to_string(py_v)}`)
      }
    } else {
      // TODO: bad class structure due to inability to override help
      if ((name == "Range" || name == "DataRange") && (k == "bounds" || k == "min_interval" || k == "max_interval")) {
        continue
      }
      if (name == "XYGlyph" && (k == "x" || k == "y")) {
        continue
      }
      python_missing.push(`${[...context, `${name}.${k}`].join(" -> ")}: bokehjs defaults to ${to_string(js_v)} but python has no such property`)
    }
  }

  for (const [k, v] of entries(python_defaults)) {
    if (!(k in bokehjs_defaults)) {
      bokehjs_missing.push(`${[...context, `${name}.${k}`].join(" -> ")}: python defaults to ${to_string(v)} but bokehjs has no such property`)
    }
  }

  function complain(failures: string[], message: string): void {
    if (failures.length > 0) {
      console.error(message)
      for (const f of failures) {
        console.error(`    ${f}`)
      }
    }
  }

  complain(different, `${name}: defaults are out of sync between Python and bokehjs`)
  complain(python_missing, `${name}: python is missing some properties found in bokehjs`)
  complain(bokehjs_missing, `${name}: bokehjs is missing some properties found in Python`)

  return different.length == 0 && python_missing.length == 0 && bokehjs_missing.length == 0
}

function diff<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set<T>(a)
  for (const bi of b) {
    result.delete(bi)
  }
  return result
}

describe("Defaults", () => {
  const internal_models = new Set([
    "Canvas",
    "CanvasPanel",
    "CartesianFrame",
    "CenterRotatable",
    "ClickButton",
    "Figure",
    "GMap",
    "LinearInterpolationScale",
    "OnOffButton",
    "ParkMillerLCG",
    "ScanningColorMapper",
    "Spline",
    "ToolButton",
    "ToolProxy",
  ])

  it("have bokehjs and bokeh implement the same set of models", () => {
    const js_models = new Set(default_resolver.names)
    const py_models = new Set(all_defaults.keys())

    for (const model of internal_models) {
      js_models.delete(model)
    }

    const missing_py = diff(js_models, py_models)
    //const missing_js = diff(py_models, js_models)

    if (missing_py.size != 0) {
      throw new ExpectationError(`expected bokeh to implement ${to_string([...missing_py])} models`)
    }
    //if (missing_js.size != 0)
    //  throw new ExpectationError(`expected bokehjs to implement ${to_string([...missing_js])} models`)
  })

  const skipped_models = new Set([
    "Figure",               // it's complicated ...
    "GeoJSONDataSource",    // geojson and _update_data()
    "WebDataSource",        // data_url and setup()
    "AjaxDataSource",       // data_url and setup()
    "ServerSentDataSource", // data_url and setup()
    "ImageURLTexture",      // url and load_image()
  ])

  for (const name of default_resolver.names) {
    const fn = skipped_models.has(name) || internal_models.has(name) ? it.skip : it

    fn(`bokehjs should implement serializable ${name} model and match defaults with bokeh`, () => {
      const model = default_resolver.get(name)
      const obj: HasProps = new (model as any)() // TODO: instantiating a possibly abstract class?

      const serializer = new DefaultsSerializer()
      const defaults = serializer.encode(obj)

      const python_defaults = get_defaults(name)
      const bokehjs_defaults = (defaults as KV).attributes as KV

      if (!check_matching_defaults([], name, python_defaults, bokehjs_defaults)) {
        throw new ExpectationError(`expected ${name} model to match defaults with bokeh`)
      }
    })
  }
})
