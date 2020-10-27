import {describe, it} from "../framework"
export * from "../framework"

import {expect, ExpectationError} from "../unit/assertions"

import all_defaults from "../.generated_defaults/defaults.json"

import {isArray, isPlainObject} from "@bokehjs/core/util/types"
import {keys, entries} from "@bokehjs/core/util/object"
import {is_equal} from "@bokehjs/core/util/eq"
import {to_string} from "@bokehjs/core/util/pretty"
import {Serializer} from "@bokehjs/core/serializer"
import {is_ref} from "@bokehjs/core/util/refs"

import {Models} from "@bokehjs/base"
import {settings} from "@bokehjs/core/settings"

import "@bokehjs/models/widgets/main"
import "@bokehjs/models/widgets/tables/main"

function get_defaults(name: string) {
  const defaults = all_defaults[name]
  if (defaults != null)
    return defaults
  else
    throw new Error(`can't find defaults for ${name}`)
}

type KV = {[key: string]: any}

function check_matching_defaults(name: string, python_defaults: KV, bokehjs_defaults: KV, serializer: Serializer): boolean {
  const different: string[] = []
  const python_missing: string[] = []
  const bokehjs_missing: string[] = []

  for (let [k, js_v] of entries(bokehjs_defaults)) {
    // special case for graph renderer node_renderer/edge_renderer
    if (name == "GraphRenderer" && (k == "node_renderer" || k == "edge_renderer"))
      continue

    // special case for factor range and start/end (null vs 0)
    if (name == "FactorRange" && (k == "start" || k == "end"))
      continue

    // special case for date picker, default is "now"
    if (name == 'DatePicker' && k == 'value')
      continue

    // special case for date time tickers, class hierarchy and attributes are handled differently
    if (name == "DatetimeTicker" && k == "tickers")
      continue

    // special case for days/months/years tickers (null vs computed integer)
    if ((name == "DaysTicker" || name == "MonthsTicker" || name == "YearsTicker") && k == "interval")
      continue

    // special case for Title derived text properties
    if (name == "Title" && (k == "text_align" || k == "text_baseline"))
      continue

    if (name == "DateSlider" && (k == "start" || k == "end" || k == "value" || k == "value_throttled"))
      continue

    if (name == "DateRangeSlider" && (k == "start" || k == "end"))
      continue

    // if testing in dev mode, we use special platform independent "Bokeh" font, instead of the default
    if (settings.dev && k.includes("text_font") && js_v == "Bokeh")
      continue

    if (k in python_defaults) {
      let py_v = python_defaults[k]

      if (is_ref(js_v)) {
        if (is_ref(py_v))
          continue // TODO: defaults.json stops at one reference level, so assume equal
        js_v = serializer.resolve_ref(js_v)!
      }

      if (!is_equal(py_v, js_v)) {
        // these two conditionals compare 'foo' and {value: 'foo'}
        if (isPlainObject(js_v) && 'value' in js_v && is_equal(py_v, js_v.value))
          continue
        if (isPlainObject(py_v) && 'value' in py_v && is_equal(py_v.value, js_v))
          continue

        if (isPlainObject(js_v) && 'attributes' in js_v && isPlainObject(py_v) && 'attributes' in py_v) {
          if (js_v.type == py_v.type) {
            check_matching_defaults(`${name}.${k}`, py_v.attributes as KV, js_v.attributes as KV, serializer)
            continue
          }
        }

        // compare arrays of objects
        if (isArray(js_v) && isArray(py_v)) {
          let equal = true

          // palettes in JS are stored as int color values
          if (k == 'palette') {
            py_v = (py_v as string[]).map((x) => parseInt(x.slice(1), 16))
          }

          if (js_v.length !== py_v.length)
            equal = false
          else {
            for (let i = 0; i < js_v.length; i++) {
              let js_vi = js_v[i]
              const py_vi = py_v[i]
              if (is_ref(js_vi)) {
                if (is_ref(py_vi))
                  continue // TODO: defaults.json stops at one reference level, so assume equal
                js_vi = serializer.resolve_ref(js_vi)!
              }
              if (!is_equal(js_vi, py_vi)) {
                equal = false
                break
              }
            }
          }

          if (equal)
            continue
        }

        different.push(`${name}.${k}: bokehjs defaults to ${to_string(js_v)} but python defaults to ${to_string(py_v)}`)
      }
    } else {
      python_missing.push(`${name}.${k}: bokehjs defaults to ${to_string(js_v)} but python has no such property`)
    }
  }

  for (const [k, v] of entries(python_defaults)) {
    if (!(k in bokehjs_defaults)) {
      bokehjs_missing.push(`${name}.${k}: python defaults to ${to_string(v)} but bokehjs has no such property`)
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

  for (const name of keys(all_defaults)) {
    // TODO: add a default to GeoJSONDataSource.geojson?
    const fn = name == "GeoJSONDataSource" ? it.skip : it

    fn(`bokehjs should implement serializable ${name} model and match defaults with bokeh`, () => {
      const model = Models(name) as any
      const obj = new model() // TODO: this relies on null hack in properties

      const serializer = new Serializer()
      const ref = serializer.to_serializable(obj)
      const attrs = serializer.resolve_ref(ref)!.attributes

      const python_defaults = get_defaults(name)
      const bokehjs_defaults = attrs

      if (!check_matching_defaults(name, python_defaults, bokehjs_defaults, serializer)) {
        throw new ExpectationError(`expected ${name} model to match defaults with bokeh`)
      }
    })
  }
})
