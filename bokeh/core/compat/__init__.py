''' Implement compatibility between Bokeh and Matplotlib.

Currently, compatibility is implemented using the third-party `mplexporter`_
library. This library does not provide a full interface to all of Matplotlib
functionality, and accordingly Bokeh's Matplotlib compatibility is limited.
A full serialization interface for Matplotlib is being planned in `MEP25`_,
and when this work is completed, a much closer and more complete integration
will be possible.

.. _MEP25: https://github.com/matplotlib/matplotlib/wiki/MEP25
.. _mplexporter: https://github.com/mpld3/mplexporter/tree/master/mplexporter

'''