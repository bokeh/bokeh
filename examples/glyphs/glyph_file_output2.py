import numpy as np
from bokeh.plotting import *
a = np.linspace(-7,7,100)
output_file("glyph_file2.html")
scatter(a, np.sin(a))
scatter(a, np.sin(a))
save()
