from __future__ import absolute_import

import numpy as np
import pandas as pd


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
data_dict = dict(uniform=uniform,
                 gauss=gauss,
                 bivariate=bivariate)
