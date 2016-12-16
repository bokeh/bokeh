import * as base64 from "base64-js"
import * as _ from "underscore"

ARRAY_TYPES =
  float32: Float32Array
  float64: Float64Array
  uint8: Uint8Array
  int8: Int8Array
  uint16: Uint16Array
  int16: Int16Array
  uint32: Uint32Array
  int32: Int32Array

DTYPES = {}
for k, v of ARRAY_TYPES
    DTYPES[v.name] = k

export convert_base64 = (input) ->
  bytes = base64.toByteArray(input['data']).buffer
  dtype = input['dtype']
  if dtype of ARRAY_TYPES
    array = new ARRAY_TYPES[dtype](bytes)
  shape = input['shape']
  return [array, shape]

export decode_column_data = (data) ->
  new_data = {}
  data_shapes = {}
  for k, v of data
    if _.isArray(v)
      arrays = []
      shapes = []
      for arr in v
        if _.isObject(arr) and 'shape' of arr
          [arr, shape] = convert_base64(arr)
          shapes.push(shape)
          arrays.push(arr)
        else if _.isArray(arr)
          shapes.push([])
          arrays.push(arr)
      if shapes.length > 0
        new_data[k] = arrays
        data_shapes[k] = shapes
      else
        new_data[k] = v
    else if _.isObject(v) and 'shape' of v
      [arr, shape] = convert_base64(v)
      new_data[k] = arr
      data_shapes[k] = shape
    else
      new_data[k] = v
      data_shapes[k] = []
  return [new_data, data_shapes]

export encode_column_data = (data, shapes) ->
  new_data = {}
  for k, v of data
    if v?.buffer instanceof ArrayBuffer
      v = serialize_array(v, shapes?[k])
    else if _.isArray(v)
      new_array = []
      for i in [0...v.length]
        if v[i]?.buffer instanceof ArrayBuffer
          new_array.push(serialize_array(v[i], shapes?[k]?[i]))
        else
          new_array.push(v[i])
      v = new_array
    new_data[k] = v
  return new_data

_arrayBufferToBase64 = (buffer) ->
    binary = ''
    bytes = new Uint8Array( buffer )
    len = bytes.byteLength
    for i in [0...len]
        binary += String.fromCharCode(bytes[i])
    return window.btoa( binary );

export serialize_array = (array, shape) ->
    b64 = _arrayBufferToBase64(array.buffer)
    dtype = DTYPES[array.constructor.name]
    data =
      data: b64,
      shape: shape,
      dtype: dtype
    return data
