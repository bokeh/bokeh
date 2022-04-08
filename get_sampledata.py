import os
import re
from os.path import join, isdir

import pandas as pd

regex = '(\:|bokeh\.])?sampledata([\:\.]\s*(\w+(\s+\w+)?))?'
path = ['plotting','models']

cwd = os.getcwd()
paths = []
notdoc = []
key = []
for p in path:
    #  print(join(cwd,p))
    for file in os.listdir(join(cwd,'examples', p, 'file')):
        _lp = join('examples', p, 'file', file)
        pp  = join(cwd,_lp)
        if isdir(pp) or file.startswith('.') or file.startswith('__'):
            continue
        with open(pp, 'r') as f:
            m = re.findall(regex, f.read())
            if m:
                paths.append(_lp)
                print(m[0].group(0))
                notdoc.append(m[0].group(1) == 'bokeh.')
                key.append([n.group(3) for n in m])

df = pd.DataFrame({'path':paths, 'keyword':key, 'not documented':notdoc})
df.to_csv('./bokeh/sphinxext/sampledata.csv', index=False)
