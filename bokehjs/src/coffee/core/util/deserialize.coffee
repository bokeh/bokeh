import * as base64 from "base64-js"

ARRAY_TYPES =
  float32: Float32Array
  float64: Float64Array
  uint8: Uint8Array
  int8: Int8Array
  uint16: Uint16Array
  int16: Int16Array
  uint32: Uint32Array
  int32: Int32Array

export convert_base64 = (input) ->
  bytes = base64.toByteArray(input['data']).buffer
  dtype = input['dtype']
  if dtype of ARRAY_TYPES
    array = new ARRAY_TYPES[dtype](bytes)
  shape = input['shape']
  return [array, shape]

export decode_column_data = (data) ->
    new_data = {}
    shapes = {}
    for k, v of data
      if v instanceof Array
        arrays = []
        shapes = []
        for arr in v
          if arr.constructor.name == 'Object'
            [arr, shape] = convert_base64(arr)
            shapes.push(shape)
            arrays.push(arr)
          else if arr.constructor.name == 'Array'
            shapes.push([])
            arrays.push(arr)
        if shapes.length
          new_data[k] = arrays
          shapes[k] = shapes
        else
          new_data[k] = v
      else if v.constructor.name == 'Object'
        [arr, shape] = convert_base64(v)
        new_data[k] = arr
        shapes[k] = shape
    return [new_data, shapes]
