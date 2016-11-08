import * as _ from "underscore"

import {DataSource} from "./data_source"
import * as hittest from "../../core/hittest"
import {SelectionManager} from "../../core/selection_manager"
import {logger} from "../../core/logging"
import * as p from "../../core/properties"


# Copyright (c) 2011, Daniel Guerrero
# All rights reserved.

# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#     * Redistributions of source code must retain the above copyright
#       notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above copyright
#       notice, this list of conditions and the following disclaimer in the
#       documentation and/or other materials provided with the distribution.

# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL DANIEL GUERRERO BE LIABLE FOR ANY
# DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.



#  * Uses the new array typed in javascript to binary base64 encode/decode
#  * at the moment just decodes a binary base64 encoded
#  * into either an ArrayBuffer (decodeArrayBuffer)
#  * or into an Uint8Array (decode)
#  *
#  * References:
#  * https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer
#  * https://developer.mozilla.org/en/JavaScript_typed_arrays/Uint8Array


_keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

# will return a  Uint8Array type
decodeArrayBuffer = (input) ->
  bytes = parseInt((input.length / 4) * 3, 10)
  ab = new ArrayBuffer(bytes)
  decode(input, ab)
  return ab

removePaddingChars = (input) ->
  lkey = _keyStr.indexOf(input.charAt(input.length - 1))
  if (lkey == 64)
    return input.substring(0,input.length - 1)
  return input

decode = (input, arrayBuffer) ->
  # get last chars to see if are valid
  input = removePaddingChars(input)
  input = removePaddingChars(input)

  bytes = parseInt((input.length / 4) * 3, 10)

  ab = new ArrayBuffer(bytes)
  uarray = new Uint8Array(ab);

  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "")

  i = 0
  j = 0
  while i < bytes
    # get the 3 octects in 4 ascii chars
    enc1 = _keyStr.indexOf(input.charAt(j++))
    enc2 = _keyStr.indexOf(input.charAt(j++))
    enc3 = _keyStr.indexOf(input.charAt(j++))
    enc4 = _keyStr.indexOf(input.charAt(j++))

    chr1 = (enc1 << 2) | (enc2 >> 4)
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
    chr3 = ((enc3 & 3) << 6) | enc4

    uarray[i] = chr1;
    if enc3 != 64
      uarray[i+1] = chr2

    if enc4 != 64
      uarray[i+2] = chr3

    i += 3

  return ab

# Datasource where the data is defined column-wise, i.e. each key in the
# the data attribute is a column name, and its value is an array of scalars.
# Each column should be the same length.
export class ColumnDataSource extends DataSource
  type: 'ColumnDataSource'

  initialize: (options) ->
    super(options)
    for k, v of @data
      bytes = decode(v[0])
      @data[k] = [new Float64Array(bytes)]

  @define {
      data:         [ p.Any,   {} ]
      column_names: [ p.Array, [] ]
    }

  @internal {
    selection_manager: [ p.Instance, (self) -> new SelectionManager({source: self}) ]
    inspected:         [ p.Any ]
    _shapes:           [ p.Any ]
  }

  get_column: (colname) ->
    return @data[colname] ? null

  get_length: () ->
    data = @data
    if _.keys(data).length == 0
      return null # XXX: don't guess, treat on case-by-case basis
    else
      lengths = _.uniq((val.length for key, val of data))

      if lengths.length > 1
        logger.debug("data source has columns of inconsistent lengths")

      return lengths[0]

      # TODO: this causes **a lot** of errors currently
      #
      # if lengths.length == 1
      #     return lengths[0]
      # else
      #     throw new Error("data source has columns of inconsistent lengths")

  columns: () ->
    # return the column names in this data source
    return _.keys(@data)

  stream: (new_data, rollover) ->
    data = @data
    for k, v of new_data
      data[k] = data[k].concat(new_data[k])
      if data[k].length > rollover
        data[k] = data[k].slice(-rollover)
    @setv('data', data, {silent: true})
    @trigger('stream')

  patch: (patches) ->
    data = @data
    for k, patch of patches
      for i in [0...patch.length]
        [ind, value] = patch[i]
        data[k][ind] = value
    @setv('data', data, {silent: true})
    @trigger('patch')
