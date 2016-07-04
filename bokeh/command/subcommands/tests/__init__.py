basic_scatter_script = """
import numpy as np
from bokeh.plotting import figure
N = 5
x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)
p1 = figure()
p1.scatter(x,y, color="#FF00FF")
"""
