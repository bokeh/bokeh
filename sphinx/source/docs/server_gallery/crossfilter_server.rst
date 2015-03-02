
| back to :ref:`gallery`

Crossfilter Example
===================

This example shows off a crossfilter tool that can be used to
interactively explore a data set by filtering and faceting across
different dimension. Drag any of the fields on the far left into
the "Filter" target to show a miniature plot or selection list that
can be used to filter the data shown in the main plot area. Simply
drag a selection on the mini-plot (after activating the box
selection tool) or select rows in the list. Drag any of the fields
into any of the "Facet" targets, and the main plot will be faceted
according to that dimension. Categorical dimensions are faceted
according to categories, continuous dimensions are binned into
roughly equal groups.

*Source:* https://github.com/bokeh/bokeh/tree/master/examples/app/crossfilter

.. raw:: html

    <iframe
        src="http://104.236.246.80:5006/bokeh/crossfilter/#"
        frameborder="0"
        style="overflow:hidden;height:1000;width:120%;margin-left:-10%"
        height="1200"
        width="1200"
    ></iframe>
