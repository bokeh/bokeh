import {describe, it} from "../framework"
export * from "../framework"

import {ExpectationError} from "../unit/assertions"

import {HasProps} from "@bokehjs/core/has_props"
import {unset} from "@bokehjs/core/properties"
import {isArray, isPlainObject} from "@bokehjs/core/util/types"
import {entries, dict} from "@bokehjs/core/util/object"
import {is_equal} from "@bokehjs/core/util/eq"
import {to_string} from "@bokehjs/core/util/pretty"
import {Serializer} from "@bokehjs/core/serialization"

import {default_resolver} from "@bokehjs/base"
import {settings} from "@bokehjs/core/settings"

import "@bokehjs/models/widgets/main"
import "@bokehjs/models/widgets/tables/main"

import yaml from "js-yaml"

const tuple = new yaml.Type("tag:yaml.org,2002:python/tuple", {
  kind: "sequence",
  resolve: (_data) => true,
  construct: (data) => [...data],
})
const schema = yaml.DEFAULT_SCHEMA.extend(tuple)

import defaults_yaml from "./defaults.yaml"
const all_defaults = dict(yaml.load(defaults_yaml, {schema}) as KV<KV<unknown>>)

type KV<T = unknown> = {[key: string]: T}

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
  if (defaults != null)
    return defaults
  else
    throw new Error(`can't find defaults for ${name}`)
}

function check_matching_defaults(context: string[], name: string, python_defaults: KV, bokehjs_defaults: KV): boolean {
  const different: string[] = []
  const python_missing: string[] = []
  const bokehjs_missing: string[] = []

  for (const [k, js_v] of entries(bokehjs_defaults)) {
    console.log(`${context.join(" -> ")} ${name}.${k}`)

    // node_renderer/edge_renderer are configured dynamicaly in bokehjs
    if (name == "GraphRenderer" && (k == "node_renderer" || k == "edge_renderer"))
      continue

    // special case for days/months/years tickers (null vs computed integer)
    if ((name == "DaysTicker" || name == "MonthsTicker" || name == "YearsTicker") && k == "interval")
      continue

    // if testing in dev mode, we use special platform independent "Bokeh" font, instead of the default
    if (settings.dev && k.includes("text_font") && (js_v == "Bokeh" || (js_v as any)?.value == "Bokeh"))
      continue

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
        check_matching_defaults([...context, `${name}.${k}`], js_v.name, py_v.attributes, js_v.attributes)
        continue
      }

      // XXX: deal with the lack of scalar properties in bokeh
      function is_vector(obj: unknown): boolean {
        return isPlainObject(obj) && (obj.type == "value" || obj.type == "field" || obj.type == "expr")
      }

      if (is_vector(py_v) && !is_vector(js_v)) {
        if (is_equal(py_v, {type: "value", value: js_v}))
          continue
      } else if (!is_vector(py_v) && is_vector(js_v)) {
        if (is_equal({type: "value", value: py_v}, js_v))
          continue
      }

      if (!is_equal(py_v, js_v)) {
        // compare arrays of objects
        if (isArray(js_v) && isArray(py_v)) {
          let equal = true

          if (js_v.length != py_v.length)
            equal = false
          else {
            for (let i = 0; i < js_v.length; i++) {
              const js_vi = js_v[i]
              const py_vi = py_v[i]

              if (is_object(js_vi) && is_object(py_vi) && js_vi.name == py_vi.name) {
                if (!check_matching_defaults([...context, `${name}.${k}[${i}]`], js_vi.name, py_vi.attributes, js_vi.attributes)) {
                  equal = false
                  break
                }
              } else if (!is_equal(js_vi, py_vi)) {
                equal = false
                break
              }
            }
          }

          if (equal)
            continue
        }

        different.push(`${[...context, `${name}.${k}`].join(" -> ")}: bokehjs defaults to ${to_string(js_v)} but python defaults to ${to_string(py_v)}`)
      }
    } else {
      // TODO: bad class structure due to inability to override help
      if ((name == "Range" || name == "DataRange") && (k == "bounds" || k == "min_interval" || k == "max_interval"))
        continue
      if (name == "XYGlyph" && (k == "x" || k == "y"))
        continue
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
      for (const f of failures)
        console.error(`    ${f}`)
    }
  }

  complain(different, `${name}: defaults are out of sync between Python and bokehjs`)
  complain(python_missing, `${name}: python is missing some properties found in bokehjs`)
  complain(bokehjs_missing, `${name}: bokehjs is missing some properties found in Python`)

  return different.length == 0 && python_missing.length == 0 && bokehjs_missing.length == 0
}

function diff<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set<T>(a)
  for (const bi of b)
    result.delete(bi)
  return result
}

describe("Defaults", () => {
  const internal_models = new Set([
    "Figure", "GMap", "Canvas", "LinearInterpolationScale", "ScanningColorMapper",
    "ToolProxy", "CenterRotatable", "Spline", "ParkMillerLCG",
  ])

  it("have bokehjs and bokeh implement the same set of models", () => {
    const js_models = new Set(default_resolver.names)
    const py_models = new Set(all_defaults.keys())

    for (const model of internal_models) {
      js_models.delete(model)
    }

    const missing_py = diff(js_models, py_models)
    //const missing_js = diff(py_models, js_models)

    if (missing_py.size != 0)
      throw new ExpectationError(`expected bokeh to implement ${to_string([...missing_py])} models`)
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
