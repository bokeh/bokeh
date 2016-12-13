import * as _ from "underscore"

import {HasProps} from "../has_props"

# Create a Bokeh reference from a HasProps subclass
#
# @param obj [HasProps] the object to create a reference for
# @return [Object] a Bokeh reference for `obj`
# @throw Error if `obj` is not a HasProps
#
export create_ref = (obj) ->
  if obj not instanceof HasProps
    throw new Error("can only create refs for HasProps subclasses")
  ref = {
    'type': obj.type
    'id': obj.id
  }
  if obj._subtype?
    ref['subtype'] = obj._subtype
  return ref

# Determine whether an object has the proper format of a Bokeh reference
#
# @param arg [Object] the object to test
# @return [bool] whether the object is a refererence
#
# @note this function does not check that the id and types are valid,
#   only that the format is correct (all required keys are present)
#
export is_ref = (arg) ->
  if _.isObject(arg)
    keys = _.keys(arg).sort()
    if keys.length==2
      return keys[0]=='id' and keys[1]=='type'
    if keys.length==3
      return keys[0]=='id' and keys[1]=='subtype' and keys[2]=='type'
  return false

# Converts a (possibly array) value into a references or references
#
# @param value [HasProps or Array of HasProps]
#
export convert_to_ref = (value) ->
  if _.isArray(value)
    return value.map(convert_to_ref)
  else
    if value instanceof HasProps
      return value.ref()
