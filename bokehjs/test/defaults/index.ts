import {describe, it} from "../framework"
export * from "../framework"

import {ExpectationError} from "../unit/assertions"

import all_defaults from "../.generated_defaults/defaults.json"

import {HasProps} from "@bokehjs/core/has_props"
import {unset} from "@bokehjs/core/properties"
import {isArray, isPlainObject} from "@bokehjs/core/util/types"
import {keys, entries} from "@bokehjs/core/util/object"
import {is_equal} from "@bokehjs/core/util/eq"
import {to_string} from "@bokehjs/core/util/pretty"
import {Serializer} from "@bokehjs/core/serializer"

import {Models} from "@bokehjs/base"
import {settings} from "@bokehjs/core/settings"

import "@bokehjs/models/widgets/main"
import "@bokehjs/models/widgets/tables/main"

class DefaultsSerializer extends Serializer {

  override to_serializable(obj: unknown): unknown {
    if (obj instanceof HasProps) {
      const struct: KV = obj.struct()
      for (const prop of obj) {
        if (prop.syncable) {
          const value = prop.is_unset ? unset : prop.get_value()
          struct.attributes[prop.attr] = this.to_serializable(value)
        }
      }
      delete struct.id
      return struct
    } else {
      return super.to_serializable(obj)
    }
  }
}

function get_defaults(name: string) {
  const defaults = all_defaults[name]
  if (defaults != null)
    return defaults
  else
    throw new Error(`can't find defaults for ${name}`)
}

type KV = {[key: string]: any}

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
    if (settings.dev && k.includes("text_font") && (js_v == "Bokeh" || js_v?.value == "Bokeh"))
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

      function is_attrs(obj: unknown): obj is {type: string, attributes: KV} {
        return isPlainObject(obj) && "attributes" in obj && "type" in obj
      }

      if (is_attrs(js_v) && is_attrs(py_v) && js_v.type == py_v.type) {
        check_matching_defaults([...context, `${name}.${k}`], js_v.type, py_v.attributes, js_v.attributes)
        continue
      }

      if (!is_equal(py_v, js_v)) {
        // these two conditionals compare 'foo' and {value: 'foo'}
        if (isPlainObject(js_v) && "value" in js_v && is_equal(py_v, js_v.value))
          continue
        if (isPlainObject(py_v) && "value" in py_v && is_equal(py_v.value, js_v))
          continue

        // compare arrays of objects
        if (isArray(js_v) && isArray(py_v)) {
          let equal = true

          if (js_v.length != py_v.length)
            equal = false
          else {
            for (let i = 0; i < js_v.length; i++) {
              const js_vi = js_v[i]
              const py_vi = py_v[i]

              if (is_attrs(js_vi) && is_attrs(py_vi) && js_vi.type == py_vi.type) {
                if (!check_matching_defaults([...context, `${name}.${k}[${i}]`], js_vi.type, py_vi.attributes, js_vi.attributes)) {
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
    "ToolProxy", "CenterRotatable", "ButtonTool", "Spline",
  ])

  it("have bokehjs and bokeh implement the same set of models", () => {
    const js_models = new Set(Models.registered_names())
    const py_models = new Set(keys(all_defaults))

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

  for (const name of Models.registered_names()) {
    const fn = skipped_models.has(name) || internal_models.has(name) ? it.skip : it

    fn(`bokehjs should implement serializable ${name} model and match defaults with bokeh`, () => {
      const model = Models.get(name)
      const obj: HasProps = new (model as any)() // TODO: instantiating a possibly abstract class?

      const serializer = new DefaultsSerializer()
      const defaults = serializer.to_serializable(obj)

      const python_defaults = get_defaults(name)
      const bokehjs_defaults = (defaults as KV).attributes

      if (!check_matching_defaults([], name, python_defaults, bokehjs_defaults)) {
        throw new ExpectationError(`expected ${name} model to match defaults with bokeh`)
      }
    })
  }
})
