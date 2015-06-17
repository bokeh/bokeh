from __future__ import absolute_import

import logging
import warnings
from os.path import dirname, join

import numpy as np
import pandas as pd
from blaze import resource

import bokeh.server.tests

log = logging.getLogger(__name__)

qty=10000

gauss = {'oneA': np.random.randn(qty),
         'oneB': np.random.randn(qty),
         'cats': np.random.randint(0,5,size=qty),
         'hundredA': np.random.randn(qty)*100,
         'hundredB': np.random.randn(qty)*100}
gauss = pd.DataFrame(gauss)

uniform = {'oneA': np.random.rand(qty),
           'oneB': np.random.rand(qty),
           'hundredA': np.random.rand(qty)*100,
           'hundredB': np.random.rand(qty)*100}
uniform = pd.DataFrame(uniform)

bivariate = {'A1': np.hstack([np.random.randn(qty/2), np.random.randn(qty/2)+1]),
             'A2': np.hstack([np.random.randn(qty/2), np.random.randn(qty/2)+2]),
             'A3': np.hstack([np.random.randn(qty/2), np.random.randn(qty/2)+3]),
             'A4': np.hstack([np.random.randn(qty/2), np.random.randn(qty/2)+4]),
             'A5': np.hstack([np.random.randn(qty/2), np.random.randn(qty/2)+5]),
             'B': np.random.randn(qty),
             'C': np.hstack([np.zeros(qty/2), np.ones(qty/2)])}
bivariate = pd.DataFrame(bivariate)

MESSAGE = """

Error loading hdfstore for %s.
Your version of Blaze is too old, or incompatible
or you have missing dependencies such as h5py and/or pytables.
"""

path = join(dirname(bokeh.server.tests.__file__), 'data', 'AAPL.hdf5')
try:
    aapl = resource("hdfstore://%s::__data__" % path)
except Exception as e:
    aapl = None
    log.error(e)
    warnings.warn(MESSAGE % "AAPL")

path = join(dirname(bokeh.server.tests.__file__), 'data', 'array.hdf5')
try:
    arr = resource(path + "::" + "array")
except Exception as e:
    arr = None
    log.error(e)
    warnings.warn(MESSAGE % "array")

path = join(dirname(bokeh.server.tests.__file__), 'data', 'CensusTracts.hdf5')
try:
    census = resource("hdfstore://%s::__data__" % path)
except Exception as e:
    census = None
    log.error(e)
    warnings.warn(MESSAGE % "CensusTracts")

data = dict(uniform=uniform,
            gauss=gauss,
            bivariate=bivariate)

if aapl:
    data['aapl'] = aapl
if census:
    data['census'] = census
if arr:
    data['array'] = arr
