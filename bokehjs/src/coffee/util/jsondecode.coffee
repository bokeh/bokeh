base64encode2uint8 = (data) ->
  raw = window.atob(data)  # Convert to string
  array = new Uint8Array(new ArrayBuffer(raw.length))
  for i in [0...raw.length]
    array[i] = raw.charCodeAt(i)
  return array

reviver = (k, v) ->
  if v and typeof v is 'object' and v.reviver_type
    if v.reviver_type == 'ArrayBuffer'
      data = base64encode2uint8(v.data)
      #console.log('found array data!', v.dtype, v.shape)
      if v.dtype == 'float32'
        return new Float32Array(data.buffer)
      if v.dtype == 'float64'
        return new Float64Array(data.buffer)
      if v.dtype == 'int8'
        return new Int8Array(data.buffer)
      if v.dtype == 'uint8'
        return new Uint8Array(data.buffer)
      if v.dtype == 'int16'
        return new Int16Array(data.buffer)
      if v.dtype == 'uint16'
        return new Uint16Array(data.buffer)
      if v.dtype == 'int32'
        return new Int32Array(data.buffer)
      if v.dtype == 'uint32'
        return new Uint32Array(data.buffer)
      if v.dtype == 'int64'
        return new Int64Array(data.buffer)
      if v.dtype == 'uint64'
        return new Uint64Array(data.buffer)
      throw "Unknown dtype for array: " + dtype
    else
      throw "Unknown reviver_type: " + v.reviver_type
  else
    return v

revive_docs_json = (d) ->
  for key of d
    val1 = d[key]
    if typeof val1 is "object"
       val2 = reviver(key, val1)
       if val1 is not val2
          d[key] = val2
       else
          revive_docs_json(val1)
  return d

json_parse = (s) ->
  throw "wtf"
  return JSON.parse(s, reviver)

module.exports =
  json_parse: json_parse
  revive_docs_json: revive_docs_json
