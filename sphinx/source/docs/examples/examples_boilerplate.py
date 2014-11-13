import numpy as np
from bokeh.plotting import *

# preparing your data
theta = np.linspace(0, 8*np.pi, 10000)[1:]
arch_x = theta*np.cos(theta)
arch_y = theta*np.sin(theta)

import numpy as np
from bokeh.plotting import *

N = 100

x = np.linspace(0.1, 5, N)