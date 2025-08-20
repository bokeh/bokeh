#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
import gzip
from base64 import b64encode
from math import nan

# Bokeh imports
from bokeh.core.json_encoder import serialize_json
from bokeh.core.serialization import Serializer
from bokeh.settings import settings

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_json_encoder():
    val0 = [None, True, False, -128, -1, 0, 1, 128, nan]
    rep0 = Serializer().serialize(val0)

    assert rep0.buffers is not None and len(rep0.buffers) == 0

    assert serialize_json(rep0.content) == """\
[null,true,false,-128,-1,0,1,128,{"type":"number","value":"nan"}]\
"""

    assert serialize_json(rep0) == """\
[null,true,false,-128,-1,0,1,128,{"type":"number","value":"nan"}]\
"""

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
  }
]\
"""

def test_json_encoder_bytes():
    val = {"key": b"uvw"}
    rep = Serializer().serialize(val)
    assert rep.buffers is not None and len(rep.buffers) == 1

    # Note mtime=1 is a workaround for an issue with Python 3.11 and 3.12
    compressed_bytes = gzip.compress(val["key"], mtime=1, compresslevel=settings.compression_level())
    encoded_bytes = b64encode(compressed_bytes).decode("utf-8")

    assert serialize_json(rep.content) == f"""\
{{"type":"map","entries":[["key",{{"type":"bytes","data":"{encoded_bytes}"}}]]}}\
"""

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
