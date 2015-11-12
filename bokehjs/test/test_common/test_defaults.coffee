_ = require "underscore"
{expect} = require "chai"
utils = require "../utils"

core_defaults = utils.require "common/defaults"
widget_defaults = utils.require "widget/defaults"

{Collections} = utils.require "common/base"
HasProperties = utils.require "common/has_properties"
Bokeh = utils.require "main"
# for side-effect of loading widgets into locations, as well as to get 'widget_locations'
widget_locations = (utils.require "widget/main").locations

all_view_model_names = []
all_view_model_names = all_view_model_names.concat(core_defaults.all_view_model_names())
all_view_model_names = all_view_model_names.concat(widget_defaults.all_view_model_names())

get_defaults = (name) ->
  core_defaults.get_defaults(name) or widget_defaults.get_defaults(name)

check_matching_defaults = (name, python_defaults, coffee_defaults) ->
  failures = []
  for k, v of coffee_defaults
    if k == 'id'
      continue
    if k of python_defaults
      py_v = python_defaults[k]
      if not _.isEqual(py_v, v)
        failures.push("#{name}.#{k}: coffee defaults to #{JSON.stringify(v)} but python defaults to #{JSON.stringify(py_v)}")
    else
      failures.push("#{name}.#{k}: coffee defaults to #{JSON.stringify(v)} but python has no such property")
  for k, v of python_defaults
    if k not of coffee_defaults
      failures.push("#{name}.#{k}: python defaults to #{JSON.stringify(v)} but coffee has no such property")

  if failures.length > 0
    console.error("#{name}: defaults are out of sync between Python and CoffeeScript")
    for f in failures
      console.error("    #{f}")

  failures.length == 0

strip_ids = (value) ->
  if _.isArray(value)
    for v in value
      strip_ids(v)
  else if _.isObject(value) and ('id' of value)
    delete value['id']
    for k, v of value
      strip_ids(v)

describe "Defaults", ->

  # this is skipped while we decide whether to automate putting them all
  # in Bokeh or just leave it as a curated (or ad hoc?) subset
  it.skip "have all non-Widget view models from Python in the Bokeh object", ->
    missing = []
    for name in core_defaults.all_view_model_names()
      if name not of Bokeh
        missing.push(name)
    for m in missing
      console.log("'Bokeh.#{m}' not found but there's a Python model '#{m}'")
    expect(missing.length).to.equal 0

  it "have all Widget view models from Python in widget locations registry", ->
    missing = []
    for name in widget_defaults.all_view_model_names()
      if name not of widget_locations
        missing.push(name)
    for m in missing
      console.log("'widget.locations.#{m}' not found but there's a Python model '#{m}'")
    expect(missing.length).to.equal 0

  it "have all view models from Python in registered locations", ->
    registered = {}
    for name in Collections.registered_names()
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
      coll = Collections(name)
      instance = new coll.model({}, {'silent' : true, 'defer_initialization' : true})
      attrs = instance.attributes_as_json()
      strip_ids(attrs)
      if not check_matching_defaults(name, get_defaults(name), attrs)
        fail_count = fail_count + 1
    expect(fail_count).to.equal 0
