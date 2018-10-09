#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

basic_scatter_script = """
import numpy as np
from bokeh.plotting import figure
from bokeh.io import curdoc
N = 5
x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)
p1 = figure()
p1.scatter(x,y, color="#FF00FF")
doc = curdoc()
doc.add_root(p1)
"""

basic_svg_scatter_script = """
import numpy as np
from bokeh.plotting import figure
from bokeh.io import curdoc
N = 5
x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)
p1 = figure(output_backend="svg")
p1.scatter(x,y, color="#FF00FF")
doc = curdoc()
doc.add_root(p1)
"""

multi_svg_scatter_script = """
import numpy as np
from bokeh.plotting import figure
from bokeh.layouts import Row
from bokeh.io import curdoc
N = 5
x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)
p1 = figure(output_backend="svg")
p1.scatter(x,y, color="#FF00FF")
p2 = figure(output_backend="svg")
p2.scatter(x,y, color="#00FF00")
doc = curdoc()
doc.add_root(Row(p1, p2))
"""
