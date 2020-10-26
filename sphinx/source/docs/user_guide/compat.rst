.. _userguide_compat:

Exploring other tools
=====================

Bokeh integrates well with a wide variety of other libraries, allowing
you to use the most appropriate tool for each task.

BokehJS
-------

Bokeh generates JavaScript, and so Bokeh output can be combined with a
wide variety of JavaScript libraries, such as `React`_. Listing all
such libraries is beyond the scope of this document; it's best to just
try and see!


Datashader
----------

Bokeh lets you pass data from Python directly into a browser so you
can interact with it quickly and responsively, even without a live
Python process. However, browser data processing limitations may
become a problem when plotting millions or billions of points.
Moreover, visual representation of such large datasets often gets
misleading due to `overplotting`_ and related issues.

`Datashader`_ is a separate Python library that renders even the
largest datasets as fixed-size raster images that faithfully
represent the data. Datashader gives you the tools to build
interactive Bokeh plot images that dynamically re-render when you
zoom and pan. This lets you output arbitrarily large datasets in
browsers.

.. image:: /_images/ds_sample.png
    :width: 900 px
    :height: 670 px
    :scale: 70 %
    :alt: Datashader Bokeh example
    :align: center

Datashader works well together with `HoloViews`_. This package
lets you switch between datashaded and non-datashaded versions
of a plot, interleave Datashader and Bokeh plots, and more. See
`this_example`_ 


HoloViews
---------

Bokeh offers you a lot of versatility when it comes to development
of complex data visualizations for the web. Even so, a higher-level
API can make day-to-day visualization tasks easier and less verbose.

`HoloViews`_ is a separate package that provides a concise declarative
interface for building Bokeh plots. HoloViews is particularly focused
on interactive use with Jupyter notebooks and enables quick prototyping
of figures for data analysis. For instance, building an interactive 
figure with three linked Bokeh plots requires only one line of code in
HoloViews.

.. image:: /_images/hv_sample.png
 :width: 976 px
 :height: 510 px
 :scale: 80 %
 :alt: HoloViews Bokeh example
 :align: center

Adding overlaid plots, slider widgets, selector widgets, selection
tools, and tabs is similarly straightforward. HoloViews objects can
also be rendered using a Matplotlib-based backend, which allows SVG or
PDF output not currently available for native Bokeh plots. See the
Holoviews `Bokeh_Backend`_ tutorial for more details.


.. _Bokeh_Backend: http://holoviews.org/Tutorials/Bokeh_Backend.html
.. _HoloViews: http://holoviews.org
.. _React: https://reactjs.org
.. _Datashader: https://github.com/bokeh/datashader
.. _overplotting: https://anaconda.org/jbednar/plotting_pitfalls
.. _this_example: https://anaconda.org/jbednar/census-hv
