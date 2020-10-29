.. _userguide_compat:

Exploring other tools
=====================

Bokeh integrates well with a wide variety of other libraries, allowing
you to use the most appropriate tool for each task.

BokehJS
-------

To display visualizations in a browser, Bokeh converts Python data and
events to JSON and communicates them to its companion JavaScript library,
BokehJS. You can also use BokehJS as a standalone library or in
combination with JavaScript frameworks, such as React_, Vue_, Angular_,
and others.

See `Developing with JavaScript`_ for more information about BokehJS.

Datashader
----------

By default, Bokeh copies datapoints from Python into a JavaScript
process running in your browser to provide responsive, locally
interactive plots. However, browsers can only handle limited
amounts of data, making it infeasible to plot millions or billions
of points directly in JavaScript. Moreover, typical plot-rendering
techniques produce misleading plots for such large datasets,
because of `overplotting`_ and related issues.

`Datashader`_ is a separate Python library that renders even the
largest datasets as fixed-size raster images that faithfully
represent the underlying data. Datashader gives you the tools to
build interactive Bokeh plot images that dynamically re-render in
Python when you zoom and pan. This approach lets you display
interactive visualizations of arbitrarily large datasets in standard
web browsers.

.. image:: /_images/ds_sample.png
    :width: 900 px
    :height: 670 px
    :scale: 70 %
    :alt: Datashader Bokeh example
    :align: center

HoloViews
---------

Bokeh offers you a lot of versatility when it comes to developing
complex data visualizations for the web. Even so, a higher-level API
can make day-to-day visualization tasks easier and less verbose.

`HoloViews`_ is a concise declarative interface that helps you build
Bokeh plots. It is a separately maintained package that focuses on
interaction with Jupyter notebooks and enables quick prototyping of
figures for data analysis. For instance, building an interactive
figure with three linked Bokeh plots requires only one line of code
in HoloViews.

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

HoloViews works well with Datashader. This lets you switch
between base and rendered versions of a plot, interleave Datashader
and Bokeh plots, and more. Here is an `example`_ of interaction
between the two.

.. _React: https://reactjs.org
.. _Angular: https://angular.io
.. _Vue: https://vuejs.org/
.. _Developing with Javascript: https://docs.bokeh.org/en/dev/docs/user_guide/bokehjs.html
.. _Datashader: https://github.com/bokeh/datashader
.. _overplotting: https://anaconda.org/jbednar/plotting_pitfalls
.. _HoloViews: http://holoviews.org
.. _example: https://anaconda.org/jbednar/census-hv
