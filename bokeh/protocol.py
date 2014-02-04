import uuid
import json
import logging
import time
from six.moves import cPickle as pickle
import numpy as np
import pandas as pd

log = logging.getLogger(__name__)

"""
serialization functions for rpc server, we serialize json messages,
as well as python data, which are lists of numpy arrays.
msg serialization one object -> one string
data serialization list of arrays -> list of buffers/strings

we have 3 protocol levels here
1.  zeromq, functions exist to separate the envelope from the payload, and
pack those up as well.

2.  arrayserver protocol, arrayserver messages are the payloads of zeromq messages,
and are packaged into clientid, reqid, msgobj (json), dataobjects -
list data which can be serialized and deserialized

3.  rpc protocol, a layer around the msgobject and a data object
"""
millifactor = 10 ** 6.
class NumpyJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, pd.Series):
            return obj.tolist()
        elif isinstance(obj, np.ndarray):
            if obj.dtype.kind == 'M':
                return obj.astype('datetime64[ms]').astype('int64').tolist()
            return obj.tolist()
        elif isinstance(obj, np.number):
            if isinstance(obj, np.integer):
                return int(obj)
            else:
                return float(obj)
        elif isinstance(obj, pd.tslib.Timestamp):
            return obj.value / millifactor
        else:
            return super(NumpyJSONEncoder, self).default(obj)

def serialize_json(obj, encoder=NumpyJSONEncoder, **kwargs):
    return json.dumps(obj, cls=encoder, **kwargs)
deserialize_json = json.loads

def default_serialize_data(data):
    """
    Parmeters
    ---------
    data : list of python objects (mostly numpy arrays)

    Returns
    ---------
    output : list of length 2n, where n is the number of objects.
        first item is pickled metadata, second is the data itself.
        for numpy arrays
        metadata : {'datatype' : 'numpy', 'dtype' : 'dtype', 'shape' : [2,2]}
        data : the array itself
        for arbitrary python objects
        metadata : {'datatype' : 'pickle'}
        data : pickled object
    """
    output = []

    def add_numpy(d):
        metadata =  {'dtype' : d.dtype,
                     'shape' : d.shape,
                     'datatype' : 'numpy'}
        metadata = pickle.dumps(metadata)
        output.append(metadata)
        output.append(d)

    def add_pickle(d):
        output.append(pickle.dumps({'datatype' : 'pickle'}))
        output.append(pickle.dumps(d, protocol=-1))

    for d in data:
        if isinstance(d, np.ndarray):
            d = np.ascontiguousarray(d)
            try:
                temp = np.frombuffer(d, dtype=d.dtype)
            except (ValueError, TypeError):
                add_pickle(d)
                continue
            add_numpy(d)
        else:
            add_pickle(d)

    return output

def default_deserialize_data(input):
    """
    Parmeters
    ---------
    input : list of strings from default_serialize_data

    Returns
    ---------
    output : list of python objects, mostly numpy arrays
    """
    output = []
    curr_index = 0
    while curr_index < len(input):
        meta = pickle.loads(input[curr_index])
        if meta['datatype'] == 'numpy':
            array = np.frombuffer(input[curr_index + 1],
                                  dtype=meta['dtype'])
            array = array.reshape(meta['shape'])
            output.append(array)
        elif meta['datatype'] == 'pickle':
            obj = pickle.loads(input[curr_index + 1])
            output.append(obj)
        curr_index += 2
    return output

serialize_web = serialize_json

deserialize_web = deserialize_json

def status_obj(status):
    return {'msgtype' : 'status',
            'status' : status}
def error_obj(error_msg):
    return {
        'msgtype' : 'error',
        'error_msg' : error_msg}
