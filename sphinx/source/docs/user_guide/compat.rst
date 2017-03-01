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


Matplotlib, seaborn, Pandas
---------------------------

Bokeh can display figures created using `Matplotlib`_, which allows
you to combine `Matplotlib`_ and Bokeh plots in the same document.
Because `Seaborn`_, `Pandas`_, and others generate Matplotlib
figures, in some cases you can also use output from each of these
packages.  To display one of these plots, pass it to the
``bokeh.mpl.to_bokeh`` function:

----

.. autofunction:: bokeh.mpl.to_bokeh

----

To achieve this interoperability, Bokeh currently relies on the third-party
library `mplexporter`_, which can convert many `Matplotlib`_ plots into Bokeh
plots. However, MPL plots using features not supported by
`mplexporter`_ may not render fully.

Interoperability with these libraries is expected to improve
significantly in the future, based on plans (`MEP 25`_) for Matplotlib
to adopt a native JSON ingest/export functionality of its own. This
will allow Bokeh and other systems to interact more robustly with
Matplotlib, potentially in both directions (i.e., with Matplotlib able
to display Bokeh plots).

You can see examples of Bokeh rendering Matplotlib plots generated
from each of these libraries in the :bokeh-tree:`examples/compat` directory.

.. _Bokeh_Backend: http://holoviews.org/Tutorials/Bokeh_Backend.html
.. _HoloViews: http://holoviews.org
.. _Matplotlib: http://matplotlib.org
.. _MEP 25: https://github.com/matplotlib/matplotlib/wiki/MEP25
.. _mplexporter:
.. _Pandas: http://pandas.pydata.org
.. _PhosphorJS: http://phosphorjs.github.io
.. _Seaborn: http://web.stanford.edu/~mwaskom/software/seaborn
