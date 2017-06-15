{expect} = require "chai"
utils = require "./utils"

core_defaults = require "./.generated_defaults/models_defaults"
widget_defaults = require "./.generated_defaults/widgets_defaults"

{isArray, isObject} = utils.require("core/util/types")
{difference} = utils.require("core/util/array")
{keys} = utils.require("core/util/object")
{isEqual} = utils.require("core/util/eq")

{Models} = utils.require "base"
mixins = utils.require "core/property_mixins"
{HasProps} = utils.require "core/has_props"

widget_models = utils.require("models/widgets/main").models
Models.register_models(widget_models)

all_view_model_names = []
all_view_model_names = all_view_model_names.concat(core_defaults.all_view_model_names())
all_view_model_names = all_view_model_names.concat(widget_defaults.all_view_model_names())

get_defaults = (name) ->
  core_defaults.get_defaults(name) or widget_defaults.get_defaults(name)

safe_stringify = (v) ->
  if v == Infinity
    "Infinity"
  else
    try
      "#{JSON.stringify(v)}"
    catch e
      "#{v}"


deep_value_to_json = (key, value, optional_parent_object) ->
  if value instanceof HasProps
    {type: value.type, attributes: value.attributes_as_json() }
  else if isArray(value)
    ref_array = []
    for v, i in value
      ref_array.push(deep_value_to_json(i, v, value))
    ref_array
  else if isObject(value)
    ref_obj = {}
    for own subkey of value
      ref_obj[subkey] = deep_value_to_json(subkey, value[subkey], value)
    ref_obj
  else
    value

check_matching_defaults = (name, python_defaults, coffee_defaults) ->
  different = []
  python_missing = []
  coffee_missing = []
  for k, js_v of coffee_defaults

    # special case for date picker, default is "now"
    if name == 'DatePicker' and k == 'value'
      continue

    # special case for date time tickers, class hierarchy and attributes are handled differently
    if name == "DatetimeTicker" and k == "tickers"
      continue

    # special case for Title derived text properties
    if name == "Title" and (k == "text_align" or k == "text_baseline")
      continue

    # special case for selections that have a method added to them
    if k == 'selected'
      delete js_v['0d'].get_view

    if k == 'id'
      continue

    if k of python_defaults
      py_v = python_defaults[k]
      strip_ids(py_v)

      if not isEqual(py_v, js_v)

        # these two conditionals compare 'foo' and {value: 'foo'}
        if isObject(js_v) and 'value' of js_v and isEqual(py_v, js_v['value'])
          continue
        if isObject(py_v) and 'value' of py_v and isEqual(py_v['value'], js_v)
          continue

        if isObject(js_v) and 'attributes' of js_v and isObject(py_v) and 'attributes' of py_v
          if js_v['type'] == py_v['type']
            check_matching_defaults("#{name}.#{k}", py_v['attributes'], js_v['attributes'])
            continue

        # compare arrays of objects
        if isArray(js_v) and isArray(py_v)
          equal = true

          # palettes in JS are stored as int color values
          if k == 'palette'
            py_v = (parseInt(x[1...], 16) for x in py_v)

          if js_v.length != py_v.length
            equal = false
          else
            for i in [0...js_v.length]
              delete js_v[i].id
              delete py_v[i].id
              if not isEqual(js_v[i], py_v[i])
                equal = false
                break

          if equal
            continue

        different.push("#{name}.#{k}: coffee defaults to #{safe_stringify(js_v)} but python defaults to #{safe_stringify(py_v)}")
    else
      python_missing.push("#{name}.#{k}: coffee defaults to #{safe_stringify(js_v)} but python has no such property")
  for k, v of python_defaults
    if k not of coffee_defaults
      coffee_missing.push("#{name}.#{k}: python defaults to #{safe_stringify(v)} but coffee has no such property")

  complain = (failures, message) ->
    if failures.length > 0
      console.error(message)
      for f in failures
        console.error("    #{f}")

  complain(different, "#{name}: defaults are out of sync between Python and CoffeeScript")
  complain(python_missing, "#{name}: python is missing some properties found in CoffeeScript")
  complain(coffee_missing, "#{name}: coffee is missing some properties found in Python")

  different.length == 0 and python_missing.length == 0 and coffee_missing.length == 0

strip_ids = (value) ->
  if isArray(value)
    for v in value
      strip_ids(v)
  else if isObject(value)
    if ('id' of value)
      delete value['id']
    for k, v of value
      strip_ids(v)

describe "Defaults", ->

  # this is skipped while we decide whether to automate putting them all
  # in Bokeh or just leave it as a curated (or ad hoc?) subset
  it.skip "have all non-Widget view models from Python in the Models object", ->
    missing = []
    for name in core_defaults.all_view_model_names()
      if name not of Models.registered_names()
        missing.push(name)
    for m in missing
      console.log("'Models.#{m}' not found but there's a Python model '#{m}'")
    expect(missing.length).to.equal 0

  it "have all Widget view models from Python in widget locations registry", ->
    missing = []
    for name in widget_defaults.all_view_model_names()
      if name not of widget_models
        missing.push(name)
    for m in missing
      console.log("'#{m}' not found but there's a Python model '#{m}'")
    expect(missing.length).to.equal 0

  it "have all view models from Python in registered locations", ->
    registered = {}
    for name in Models.registered_names()
      registered[name] = true
    missing = []
    for name in all_view_model_names
      if name not of registered
        missing.push(name)
    for m in missing
      console.log("'base.locations[\"#{m}\"]' not found but there's a Python model '#{m}'")
    expect(missing.length).to.equal 0

  it "match between Python and CoffeeScript", ->
    fail_count = 0
    for name in all_view_model_names
      model = Models(name)
      instance = new model({}, {silent: true, defer_initialization: true})
      attrs = instance.attributes_as_json(true, deep_value_to_json)
      strip_ids(attrs)

      python_defaults = get_defaults(name)
      coffee_defaults = attrs
      if not check_matching_defaults(name, python_defaults, coffee_defaults)
        console.log(name)
        # console.log('python defaults:')
        # console.log(python_defaults)
        # console.log('coffee defaults:')
        # console.log(coffee_defaults)
        console.log(difference(keys(python_defaults), keys(coffee_defaults)))
        fail_count = fail_count + 1

    console.error("Python/Coffee matching defaults problems: #{fail_count}")
    expect(fail_count).to.equal 0
