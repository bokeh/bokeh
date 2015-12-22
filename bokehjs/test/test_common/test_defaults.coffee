_ = require "underscore"
{expect} = require "chai"
utils = require "../utils"

core_defaults = utils.require "common/defaults"
widget_defaults = utils.require "widget/defaults"

{Collections} = utils.require "common/base"
HasProperties = utils.require "common/has_properties"
properties = utils.require "common/properties"
Bokeh = utils.require "main"
# for side-effect of loading widgets into locations, as well as to get 'widget_locations'
widget_locations = (utils.require "widget/main").locations

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

check_matching_defaults = (name, python_defaults, coffee_defaults) ->
  different = []
  python_missing = []
  coffee_missing = []
  for k, v of coffee_defaults
    if k == 'id'
      continue
    if k of python_defaults
      py_v = python_defaults[k]
      if not _.isEqual(py_v, v)
        different.push("#{name}.#{k}: coffee defaults to #{safe_stringify(v)} but python defaults to #{safe_stringify(py_v)}")
    else
      python_missing.push("#{name}.#{k}: coffee defaults to #{safe_stringify(v)} but python has no such property")
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
      # merge in display_defaults() which aren't in the main
      # attributes, the overall setup here is sketchy right now
      # because python never leaves these things unset. We need an
      # "inherit" value, like in CSS, perhaps.
      # But at least we can check that display_defaults() matches
      # what Python sends.
      display_specs = [ 'line_color', 'line_width', 'line_alpha', 'fill_color', 'fill_alpha',
                        'text_font_size', 'text_color', 'text_alpha' ]
      display_attr_is_spec = (name) ->
        for s in display_specs
          if name.endsWith(s) # gratuitous ES6
            return true
        return false
      if 'display_defaults' of instance
        display = instance.display_defaults()
        for k in Object.keys(display)
          if k of attrs
            console.error("#{name}.#{k}: property present in both CoffeeScript attrs and display_defaults()")

          if display_attr_is_spec(k)
            orig = display[k]
            if not (_.isObject(orig) and ('field' of orig or 'value' of orig))
              # convert to 'spec dict' format
              display[k] = { 'value' : display[k] }

        attrs = _.extend({}, display, attrs)

      # Merge in "factory" attrs, which don't go in attributes
      # in the actual code, but for our current purpose
      # let's pretend they do because they do "in effect"
      # and we probably want to put them there eventually
      for prop_kind, func of properties.factories
        if prop_kind == 'visuals' # visuals is the display_defaults() case above
          continue
        if prop_kind of instance
          props_of_this_kind = func(instance)
          prop_values = {}
          for p, v of props_of_this_kind
            if v.field?
              prop_values[p] = { 'field' : v.field }
            else if v.fixed_value?
              prop_values[p] = { 'value' : v.fixed_value }
            else
              n = v.value()
              if isNaN(n) or n == null
                prop_values[p] = null
              else
                prop_values[p] = { 'value' : n }

            dict = prop_values[p]
            if dict?
              if v.units?
                prop_values[p]['units'] = v.units
              else
                # properties.coffee hardcodes these units defaults
                if prop_kind == 'distances' and 'units' not of dict
                  dict['units'] = "data"
                if prop_kind == 'angles' and 'units' not of dict
                  dict['units'] = "rad"

          _.extend(attrs, prop_values)

      if not check_matching_defaults(name, get_defaults(name), attrs)
        fail_count = fail_count + 1

    console.error("Python/Coffee matching defaults problems: #{fail_count}")
    # If this is failing because the problem count is now lower,
    # then edit this number to be lower. If it's failing because
    # it's higher, fix the newly-introduced errors. Eventually we
    # will get to zero.
    expect(fail_count).to.equal 63
