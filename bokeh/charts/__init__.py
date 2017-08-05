from __future__ import absolute_import

from ..util.deprecation import deprecated

deprecated("""
The bokeh.charts API has moved to a separate 'bkcharts' package.

This compatibility shim will remain until Bokeh 1.0 is released.
After that, if you want to use this API you will have to install
the bkcharts package explicitly.
""")

from bkcharts import * # NOQA
