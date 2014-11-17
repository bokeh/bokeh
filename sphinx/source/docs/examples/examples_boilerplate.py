import numpy as np
from bokeh.plotting import *

x = [1, 2, 3, 4, 5]
y = [6, 7, 2, 4, 5]
y1 = [el**2 for el in x]
y2 = [10**el for el in x]
y3 = [10**(el**2) for el in x]
