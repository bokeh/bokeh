import numpy as np
import pandas
def make_source(**kwargs):
    # need to cast pandas as numpy so we can rowindex easily
    for k in kwargs.keys():
        if isinstance(kwargs[k], pandas.Series):
            kwargs[k] = kwargs[k].view(np.ndarray)
    output = []
    flds = kwargs.keys()
    for idx in range(len(kwargs.values()[0])):
        point = {}
        for f in flds:
            val = kwargs[f][idx]
            if isinstance(val, float) and  np.isnan(val):
                val = "NaN"
            elif isinstance(val, np.ndarray):
                val = val.tolist()
            else:
                val = kwargs[f][idx]
            point[f] = val
        output.append(point)
    return output
