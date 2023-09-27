#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from math import nan

# Bokeh imports
from bokeh.core.json_encoder import serialize_json
from bokeh.core.serialization import Serializer

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_json_encoder():
    val0 = [None, True, False, -128, -1, 0, 1, 128, nan, {"key_0": b"uvw"}]
    rep0 = Serializer().serialize(val0)

    assert rep0.buffers is not None and len(rep0.buffers) == 1

    assert serialize_json(rep0.content) == """\
[null,true,false,-128,-1,0,1,128,{"type":"number","value":"nan"},{"type":"map","entries":[["key_0",{"type":"bytes","data":"dXZ3"}]]}]\
"""

    assert serialize_json(rep0) == """\
[null,true,false,-128,-1,0,1,128,{"type":"number","value":"nan"},{"type":"map","entries":[["key_0",{"type":"bytes","data":{"id":"%s"}}]]}]\
""" % rep0.buffers[0].id

    assert serialize_json(rep0.content, pretty=True) == """\
[
  null,
  true,
  false,
  -128,
  -1,
  0,
  1,
  128,
  {
    "type": "number",
    "value": "nan"
  },
  {
    "type": "map",
    "entries": [
      [
        "key_0",
        {
          "type": "bytes",
          "data": "dXZ3"
        }
      ]
    ]
  }
]\
"""

    assert serialize_json(rep0, pretty=True) == """\
[
  null,
  true,
  false,
  -128,
  -1,
  0,
  1,
  128,
  {
    "type": "number",
    "value": "nan"
  },
  {
    "type": "map",
    "entries": [
      [
        "key_0",
        {
          "type": "bytes",
          "data": {
            "id": "%s"
          }
        }
      ]
    ]
  }
]\
""" % rep0.buffers[0].id

def test_json_encoder_dict_no_sort():
    val0 = {nan: 0, "key_1": 1, "abc": 2, "key_0": 3}
    rep0 = Serializer().serialize(val0)

    assert serialize_json(rep0) == """\
{"type":"map","entries":[[{"type":"number","value":"nan"},0],["key_1",1],["abc",2],["key_0",3]]}\
"""

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
