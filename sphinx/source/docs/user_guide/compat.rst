.. _userguide_compat:

Leveraging Other Libraries
==========================

Bokeh integrates well with a wide variety of other libraries, allowing
you to use the most appropriate tool for each task.

JavaScript
----------

Bokeh generates JavaScript, and so Bokeh output can be combined with a
wide variety of JavaScript libraries, such as `PhosphorJS`_.  Listing
such libraries is beyond the scope of this document; it's best just to
try and see!

HoloViews
---------

`HoloViews`_ is a separately maintained package that provides a
concise declarative interface for building Bokeh plots. HoloViews is
particularly focused on interactive use in a Jupyter notebook,
allowing quick prototyping of figures for data analysis.  For
instance, to build an interactive figure with three linked Bokeh plots
requires only one line of code in HoloViews:

.. image:: /_images/hv_sample.png
 :width: 976 px
 :height: 510 px
 :scale: 80 %
 :alt: HoloViews Bokeh example
 :align: center

.. # Code, for reference, for holoviews 1.4.3:
..
.. import numpy as np
.. import holoviews as hv
.. hv.notebook_extension('bokeh')
..
.. xs = np.linspace(0, np.pi*4, 100)
.. data = (xs, np.sin(xs))
..
.. (hv.Curve(data) + hv.Points(data)[4:10] + hv.Text(2,0,'Some text'))

Adding overlaid plots, slider widgets, selector widgets, selection
tools, and tabs is similarly straightforward.  HoloViews objects can
also be rendered using a Matplotlib-based backend, which allows SVG or
PDF output not currently available for native Bokeh plots.  See the
Holoviews `Bokeh_Backend`_ tutorial for more details.


.. _Bokeh_Backend: http://holoviews.org/Tutorials/Bokeh_Backend.html
.. _HoloViews: http://holoviews.org
.. _PhosphorJS: http://phosphorjs.github.io
