''' Functions useful for loading Bokeh code and data in Jupyter notebooks.

'''
from __future__ import absolute_import

from .deprecation import deprecated

deprecated((0, 12, 10), "bokeh.util.notebook", "bokeh.io.notebook")

from bokeh.io.notebook import get_comms, load_notebook ; get_comms, load_notebook
