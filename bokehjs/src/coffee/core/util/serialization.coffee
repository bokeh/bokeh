import {isArray, isObject} from "./types"

export ARRAY_TYPES =
  float32: Float32Array
  float64: Float64Array
  uint8: Uint8Array
  int8: Int8Array
  uint16: Uint16Array
  int16: Int16Array
  uint32: Uint32Array
  int32: Int32Array

export DTYPES = {}
for k, v of ARRAY_TYPES
    DTYPES[v.name] = k

# record endian-ness
buf = new ArrayBuffer(2)
buf8 = new Uint8Array(buf)
buf16 = new Uint16Array(buf)
buf8[0] = 0xAA
buf8[1] = 0xBB
if (buf16[0] == 0xBBAA)
  _order = "little"
else
  _order = "big"
export BYTE_ORDER = _order

export swap16 = (a) ->
  x = new Uint8Array(a.buffer, a.byteOffset, a.length * 2)
  for i in [0...x.length] by 2
    t = x[i]
    x[i] = x[i + 1]
    x[i + 1] = t
  null

export swap32 = (a) ->
  x = new Uint8Array(a.buffer, a.byteOffset, a.length * 4)
  for i in [0...x.length] by 4
    t = x[i]
    x[i] = x[i + 3]
    x[i + 3] = t
    t = x[i + 1]
    x[i + 1] = x[i + 2]
    x[i + 2] = t
  null

export swap64 = (a) ->
  x = new Uint8Array(a.buffer, a.byteOffset, a.length * 8)
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

export process_buffer = (spec, buffers) ->
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

export process_array = (obj, buffers) ->
  if isObject(obj) and '__ndarray__' of obj
    return decode_base64(obj)
  else if isObject(obj) and '__buffer__' of obj
    return process_buffer(obj, buffers)
  else if isArray(obj)
    return [obj, []]

export arrayBufferToBase64 = (buffer) ->
  bytes = new Uint8Array( buffer )
  binary = (String.fromCharCode(b) for b in bytes)
  return btoa( binary.join("") )

export base64ToArrayBuffer = (base64) ->
  binary_string = atob(base64)
  len = binary_string.length
  bytes = new Uint8Array( len )
  for i in [0...len]
    bytes[i] = binary_string.charCodeAt(i)
  return bytes.buffer

export decode_base64 = (input) ->
  bytes = base64ToArrayBuffer(input['__ndarray__'])
  dtype = input['dtype']
  if dtype of ARRAY_TYPES
    array = new ARRAY_TYPES[dtype](bytes)
  shape = input['shape']
  return [array, shape]

export encode_base64 = (array, shape) ->
  b64 = arrayBufferToBase64(array.buffer)
  dtype = DTYPES[array.constructor.name]
  data =
    __ndarray__: b64,
    shape: shape,
    dtype: dtype
  return data

export decode_column_data = (data, buffers) ->
  new_data = {}
  new_shapes = {}

  for k, v of data

    # might be array of scalars, or might be ragged array or arrays
    if isArray(v)

      # v is just a regular array of scalars
      if v.length == 0 or not (isObject(v[0]) or isArray(v[0]))
        new_data[k] = v
        continue

      # v is a ragged array of arrays
      arrays = []
      shapes = []
      for obj in v
        [arr, shape] = process_array(obj, buffers)
        arrays.push(arr)
        shapes.push(shape)

      new_data[k] = arrays
      new_shapes[k] = shapes

    # must be object or array (single array case)
    else
      [arr, shape] = process_array(v, buffers)
      new_data[k] = arr
      new_shapes[k] = shape

  return [new_data, new_shapes]

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
