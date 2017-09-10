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

# record endian-ness
buf = new ArrayBuffer(2)
buf8 = new Uint8Array(buf)
buf16 = new Uint16Array(buf)
buf8[0] = 0xAA
buf8[1] = 0xBB
if (buf16[0] == 0xBBAA)
  BYTE_ORDER = "little"
else
  BYTE_ORDER = "big"

swap16 = (arr) ->
  x = new Uint8Array(arr.buffer, arr.byteOffset, arr.length * 2)
  for i in [0...x.length] by 2
    t = x[i]
    x[i] = x[i + 1]
    x[i + 1] = t
    null

swap32 = (arr) ->
  x = new Uint8Array(arr.buffer, arr.byteOffset, arr.length * 4)
  for i in [0...x.length] by 4
    t = x[i]
    x[i] = x[i + 3]
    x[i + 3] = t
    t = x[i + 1]
    x[i + 1] = x[i + 2]
    x[i + 2] = t
    null

swap64 = (arr) ->
  x = new Uint8Array(arr.buffer, arr.byteOffset, arr.length * 8)
  for i in [0...x.length] by 8
    t = x[i]
    x[i] = x[i + 7];
    x[i + 7] = t
    t = x[i + 1]
    x[i + 1] = x[i + 6]
    x[i + 6] = t
    t = x[i + 2]
    x[i + 2] = x[i + 5]
    x[i + 5] = t
    t = x[i + 3]
    x[i + 3] = x[i + 4]
    x[i + 4] = t
    null

_process_buffer = (spec, buffers) ->
  need_swap = (spec.order != BYTE_ORDER)
  shape = spec.shape
  bytes = null
  for buf in buffers
    header = JSON.parse(buf[0])
    if header.id == spec.__buffer__
      bytes = buf[1]
      break
  arr = new ARRAY_TYPES[spec.dtype](bytes)
  if need_swap
    if arr.BYTES_PER_ELEMENT == 2
      swap16(arr)
    else if arr.BYTES_PER_ELEMENT == 4
      swap32(arr)
    else if arr.BYTES_PER_ELEMENT == 8
      swap64(arr)
  return [arr, shape]

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

export decode_column_data = (data, buffers) ->
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
        else if isObject(arr) and '__buffer__' of arr
          [arr, shape] = _process_buffer(arr, buffers)
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

    else if isObject(v) and '__buffer__' of v
      [arr, shape] = _process_buffer(v, buffers)
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
