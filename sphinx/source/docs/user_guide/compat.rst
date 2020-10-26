.. _userguide_compat:

Exploring other tools
=====================

Bokeh integrates well with a wide variety of other libraries, allowing
you to use the most appropriate tool for each task.

BokehJS
-------

Bokeh generates JavaScript. This makes its output fully compatible with
a wide variety of JavaScript libraries, such as `React`_. Listing all
such libraries is beyond the scope of this document; it's best to just
try and see!


Datashader
----------

Bokeh lets you pass data from Python directly into a browser so you
can interact with it quickly and responsively, even without a live
Python process. However, browser data processing limitations may
become a problem when plotting millions or billions of points.
Moreover, visual representation of such large datasets often gets
misleading because of `overplotting`_ and related issues.

`Datashader`_ is a separate Python library that renders even the
largest datasets as fixed-size raster images that faithfully
represent data. Datashader gives you the tools to build interactive
Bokeh plot images that dynamically re-render when you zoom and pan.
This lets you output visualizations of arbitrarily large datasets in
browsers.

.. image:: /_images/ds_sample.png
    :width: 900 px
    :height: 670 px
    :scale: 70 %
    :alt: Datashader Bokeh example
    :align: center

HoloViews
---------

Bokeh offers you a lot of versatility when it comes to development
of complex data visualizations for the web. Even so, a higher-level
API can make day-to-day visualization tasks easier and less verbose.

`HoloViews`_ is a concise declarative interface that helps you build
Bokeh plots. It focuses on interaction with Jupyter notebooks and
enables quick prototyping of figures for data analysis. For instance,
building an interactive figure with three linked Bokeh plots requires
only one line of code in HoloViews.

.. image:: /_images/hv_sample.png
 :width: 976 px
 :height: 510 px
 :scale: 80 %
 :alt: HoloViews Bokeh example
 :align: center

Adding overlaid plots, slider widgets, selector widgets, selection
tools, and tabs is similarly straightforward.

Further synergy
---------------

You can render HoloViews objects with the `Matplotlib`_ library. This
enables SVG and PDF output not currently available for native Bokeh
plots. See the HoloViews `tutorial`_ on Bokeh backend for more
details.

HoloViews works well with Datashader. This lets you switch
between base and rendered versions of a plot, interleave Datashader
and Bokeh plots, and more. Here is an `example`_ of interaction
between the two.

.. _tutorial: http://holoviews.org/Tutorials/Bokeh_Backend.html
.. _HoloViews: http://holoviews.org
.. _React: https://reactjs.org
.. _Datashader: https://github.com/bokeh/datashader
.. _overplotting: https://anaconda.org/jbednar/plotting_pitfalls
.. _example: https://anaconda.org/jbednar/census-hv
.. _Matplotlib: https://matplotlib.org/
