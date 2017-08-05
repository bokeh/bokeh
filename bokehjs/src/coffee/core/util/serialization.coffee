import {isArray, isObject} from "./types"

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

_arrayBufferToBase64 = (buffer) ->
  bytes = new Uint8Array( buffer )
  binary = (String.fromCharCode(b) for b in bytes)
  return btoa( binary.join("") )

_base64ToArrayBuffer = (base64) ->
  binary_string = atob(base64)
  len = binary_string.length
  bytes = new Uint8Array( len )
  for i in [0...len]
    bytes[i] = binary_string.charCodeAt(i)
  return bytes.buffer

export decode_base64 = (input) ->
  bytes = _base64ToArrayBuffer(input['__ndarray__'])
  dtype = input['dtype']
  if dtype of ARRAY_TYPES
    array = new ARRAY_TYPES[dtype](bytes)
  shape = input['shape']
  return [array, shape]

export encode_base64 = (array, shape) ->
  b64 = _arrayBufferToBase64(array.buffer)
  dtype = DTYPES[array.constructor.name]
  data =
    __ndarray__: b64,
    shape: shape,
    dtype: dtype
  return data

export decode_column_data = (data) ->
  new_data = {}
  data_shapes = {}
  for k, v of data
    if isArray(v)
      arrays = []
      shapes = []
      for arr in v
        if isObject(arr) and '__ndarray__' of arr
          [arr, shape] = decode_base64(arr)
          shapes.push(shape)
          arrays.push(arr)
        else if isArray(arr)
          shapes.push([])
          arrays.push(arr)
      if shapes.length > 0
        new_data[k] = arrays
        data_shapes[k] = shapes
      else
        new_data[k] = v
    else if isObject(v) and '__ndarray__' of v
      [arr, shape] = decode_base64(v)
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
      v = encode_base64(v, shapes?[k])
    else if isArray(v)
      new_array = []
      for i in [0...v.length]
        if v[i]?.buffer instanceof ArrayBuffer
          new_array.push(encode_base64(v[i], shapes?[k]?[i]))
        else
          new_array.push(v[i])
      v = new_array
    new_data[k] = v
  return new_data
