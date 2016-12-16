from __future__ import absolute_import

import numpy as np
import base64

import bokeh.util.serialization as bus
from bokeh.settings import settings

def test_id():
    assert len(bus.make_id()) == 36
    assert isinstance(bus.make_id(), str)

def test_id_with_simple_ids():
    import os
    os.environ["BOKEH_SIMPLE_IDS"] = "yes"
    assert bus.make_id() == "1001"
    assert bus.make_id() == "1002"
    del os.environ["BOKEH_SIMPLE_IDS"]

testing = [[float('nan'), 3], [float('-inf'), [float('inf')]]]
expected = [['NaN', 3.0], ['-Infinity', ['Infinity']]]

def test_traverse_return_valid_json():
    assert bus.traverse_data(testing) == expected

def test_traverse_with_numpy():
    assert bus.traverse_data(testing, True) == expected

def test_traverse_without_numpy():
    assert bus.traverse_data(testing, False) == expected

def test_encoding_disabled_by_settings():

    assert len(bus.array_types) > 0

    cutoff = settings.binary_array_cutoff()

    assert cutoff > 0

    dts = set(np.typeDict.values()) - set([np.void])

    for dt in dts:
        a = np.empty(shape=cutoff-1, dtype=dt)
        assert bus.encoding_disabled(a)


def test_encoding_disabled_by_cutoff():

    import os
    os.environ["BOKEH_USE_BINARY_ARRAYS"] = "no"

    assert len(bus.array_types) > 0

    cutoff = settings.binary_array_cutoff()

    assert cutoff > 0

    dts = set(np.typeDict.values()) - set([np.void])

    for dt in dts:
        a = np.empty(shape=cutoff+1, dtype=dt)
        assert bus.encoding_disabled(a)

    del os.environ["BOKEH_USE_BINARY_ARRAYS"]

def test_encoding_disabled_by_dtype():

    assert len(bus.array_types) > 0

    cutoff = settings.binary_array_cutoff()

    assert cutoff > 0

    dt_ok = bus.array_types
    dt_bad = set(np.dtype(x) for x in set(np.typeDict.values()) - set([np.void])) - dt_ok

    for dt in dt_ok:
        a = np.empty(shape=cutoff+1, dtype=dt)
        assert not bus.encoding_disabled(a)

    for dt in dt_bad:
        a = np.empty(shape=cutoff+1, dtype=dt)
        assert bus.encoding_disabled(a)

def test_encode_base64_dict():
    for dt in [np.float32, np.float64, np.int64]:
        for shape in [(12,), (2, 6), (2,2,3)]:
            a = np.arange(12, dtype=dt)
            a.reshape(shape)
            d = bus.encode_base64_dict(a)

            assert 'shape' in d
            assert d['shape'] == a.shape

            assert 'dtype' in d
            assert d['dtype'] == a.dtype.name

            assert 'data' in d
            b64 = base64.b64decode(d['data'])
            aa = np.fromstring(b64, dtype=d['dtype'])
            assert np.array_equal(a, aa)

def test_decode_base64_dict():
    for dt in [np.float32, np.float64, np.int64]:
        for shape in [(12,), (2, 6), (2,2,3)]:
            a = np.arange(12, dtype=dt)
            a.reshape(shape)
            data = base64.b64encode(a).decode('utf-8')
            d = {
                'data'  : data,
                'dtype' : a.dtype.name,
                'shape' : a.shape
            }
            aa = bus.decode_base64_dict(d)

            assert aa.shape == a.shape

            assert aa.dtype.name == a.dtype.name

            assert np.array_equal(a, aa)

def test_encode_decode_roundtrip():
    for dt in [np.float32, np.float64, np.int64]:
        for shape in [(12,), (2, 6), (2,2,3)]:
            a = np.arange(12, dtype=dt)
            a.reshape(shape)
            d = bus.encode_base64_dict(a)
            aa = bus.decode_base64_dict(d)
            assert np.array_equal(a, aa)
