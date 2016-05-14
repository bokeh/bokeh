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
      Cls = window[v.dtype[0].toUpperCase() + v.dtype.slice(1) + 'Array']
      if Cls
        return new Cls(data.buffer)
      throw "Unknown dtype for array: " + v.dtype
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
  return JSON.parse(s, reviver)

module.exports =
  json_parse: json_parse
  revive_docs_json: revive_docs_json
