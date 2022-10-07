:notoc:

.. _gallery:

Gallery
#######

See the sections below for examples of using Bokeh in different ways.

.. contents::
    :local:
    :depth: 1

.. _gallery_server_examples:

Server App Examples
===================

The examples linked below all show off usage of the Bokeh server. The
Bokeh server provides a place where interesting things can happen---data
can be updated to in turn update the plot, and UI and selection events
can be processed to trigger more visual updates.

.. raw:: html

    <div class="container">
      <div class="row">

        <div class="col-lg-3 col-md-6 col-sm-6">
          <a target="_blank" href="//demo.bokeh.org/movies">
          <img src="https://static.bokeh.org/movies_t.png" class="img-responsive img-thumbnail" alt="Thumbnail featuring an interactive query tool for a set of IMDB data. Tool features a default graph of the Tomato Meter (x-axis) against the number of reviews (y-axis). Graph can be refined using multiple variables including cast names, director name, number of Oscar wins, year released, end year released, genre, dollar at the box office, and more.">
          </a>
        </div>
        <div class="col-lg-3 col-md-6 col-sm-6">
          <p>An interactive query tool for a set of IMDB data</p>
          <p><em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/blob/master/examples/app/movies">movies</a></p>
        </div>

        <div class="col-lg-3 col-md-6 col-sm-6">
          <a target="_blank" href="//demo.bokeh.org/selection_histogram">
            <img src="https://static.bokeh.org/selection_histogram_t.png" class="img-responsive img-thumbnail" alt="Thumbnail featuring axis histograms for selected and non-selected points in a scatter plot. Axes unlabeled.">
          </a>
        </div>
        <div class="col-lg-3 col-md-6 col-sm-6">
          <p>Shows axis histograms for selected <em>and</em> non-selected points in a scatter plot</p>
          <p><em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/blob/master/examples/app/selection_histogram.py">selection_histogram</a></p>
        </div>


        <div class="col-lg-3 col-md-6 col-sm-6">
          <a target="_blank" href="//demo.bokeh.org/weather">
            <img src="https://static.bokeh.org/weather_t.png" class="img-responsive img-thumbnail" alt="Thumbnail featuring interactive weather statistics for three cities. Features drop down for city and distribution. X-axis features date, the y-axis features temperature.">
          </a>
        </div>
        <div class="col-lg-3 col-md-6 col-sm-6">
          <p>Interactive weather statistics for three cities</p>
          <p><em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/tree/master/examples/app/weather">weather</a></p>
        </div>

        <div class="col-lg-3 col-md-6 col-sm-6">
          <a target="_blank" href="//demo.bokeh.org/sliders">
            <img src="https://static.bokeh.org/sliders_t.png" class="img-responsive img-thumbnail"></img alt="Thumbnail of plotted trigonometric function with sliders for offset, amplitude, phase, and frequency.">
          </a>
        </div>
        <div class="col-lg-3 col-md-6 col-sm-6">
          <p>A basic demo that has sliders for controlling a plotted trigonometric function</p>
          <p><em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/blob/master/examples/app/sliders.py">sliders.py</a></p>
        </div>

        <div class="col-lg-3 col-md-6 col-sm-6">
          <a target="_blank" href="//demo.bokeh.org/crossfilter">
            <img src="https://static.bokeh.org/crossfilter_t.png" class="img-responsive img-thumbnail" alt="Thumbnail of example scatter plot with drop downs for x-axis, y-axis, color, and size. Default graph features mpg on the x-axis, hp on the y-axis, and shows a downward exponential trend.">
          </a>
        </div>
        <div class="col-lg-3 col-md-6 col-sm-6">
          <p>Explore the "autompg" data set by selecting and highlighting different dimensions</p>
          <p><em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/blob/master/examples/app/crossfilter">crossfilter</a></p>
        </div>

        <div class="col-lg-3 col-md-6 col-sm-6">
          <a target="_blank" href="//demo.bokeh.org/gapminder">
            <img src="https://static.bokeh.org/gapminder_t.png" class="img-responsive img-thumbnail"></img alt="Thumbnail of a page featuring a reproduction of the Gapminder demo and containing an embedded TED talk video added using a custom page template. Gapminder demo shows children per woman (x-axis), life expectancy at birth in years (y-axis), by nation, over the years (slider), and a play button that allows data to play across slider range of 1964 - 2012.">
          </a>
        </div>
        <div class="col-lg-3 col-md-6 col-sm-6">
          <p>A reproduction of the famous Gapminder demo, with embedded video added using a custom page template</p>
          <p><em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/blob/master/examples/app/gapminder">gapminder</a></p>
        </div>

        <div class="col-lg-3 col-md-6 col-sm-6">
          <a target="_blank" href="//demo.bokeh.org/stocks">
            <img src="https://static.bokeh.org/stocks_t.png" class="img-responsive img-thumbnail"></img alt="A clickable image of linked plots, summary statistics, and correlations for market data. Contains two drop down selections for different investment options. Left features a scatterplot of option one's returns vs option two's returns. Below features a line plot of each individual option. Right shows basic statistics of each option and each option's returns.">
          </a>
        </div>
        <div class="col-lg-3 col-md-6 col-sm-6">
          <p>Linked plots, summary statistics, and correlations for market data</p>
          <p><em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/tree/master/examples/app/stocks">stocks</a></p>
        </div>

        <div class="col-lg-3 col-md-6 col-sm-6">
          <a target="_blank" href="//demo.bokeh.org/surface3d">
            <img src="https://static.bokeh.org/surface3d_t.png" class="img-responsive img-thumbnail"></img alt="Thumbnail for surface3d example. Axes are rotated slightly and shown with perspective. A 3D surface is plotted, and colored with a heat map corresponding to z axis value.">
          </a>
        </div>
        <div class="col-lg-3 col-md-6 col-sm-6">
          <p>An updating 3d plot that demonstrates using Bokeh custom extensions to wrap third-party JavaScript libraries</p>
          <p><em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/blob/master/examples/app/surface3d">surface3d</a></p>
        </div>

        <div class="col-lg-3 col-md-6 col-sm-6">
          <a target="_blank" href="//demo.bokeh.org/export_csv">
            <img src="https://static.bokeh.org/export_csv_t.png" class="img-responsive img-thumbnail" alt="Thumbnail for export_csv example. Image shows an interface for filtering data with a slider widget, and writing the results by clicking a button.">
          </a>
        </div>
        <div class="col-lg-3 col-md-6 col-sm-6">
          <p>Explore the "autompg" data set by selecting and highlighting different dimensions</p>
          <p><em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/blob/master/examples/app/export_csv">export_csv</a></p>
        </div>

      <div>
    </div>

.. _gallery_notebook_examples:

Notebook Examples
=================

The best place to immediately experiment with Bokeh in notebooks is in the
`live tutorial notebooks`_ hosted online by MyBinder.


.. _gallery_static_examples:

Standalone Examples
===================

All of
the examples below are located in the :bokeh-tree:`examples`
subdirectory of your Bokeh checkout. By "standalone" we mean that
these examples make no use of the Bokeh server. These plots still
have many interactive tools and features, including linked panning
and brushing, and hover inspectors.

Click on an image below to see its code and interact with the live
plot.

.. tab-set::
    :class: bk-gallery-tabs

    .. tab-item:: Basic plotting

        .. bokeh-gallery::

            basic/scatters
            basic/lines
            basic/data
            basic/axes
            basic/bars
            basic/areas
            basic/layouts
            basic/annotations
            basic/styling

    .. tab-item:: Special topics

        .. bokeh-gallery::

            topics/images
            topics/mathtext
            topics/contour
            topics/hex
            topics/categorical
            topics/geo
            topics/graph
            topics/pie
            topics/stats

        ..  topics/timeseries

    .. tab-item:: Interaction

        .. bokeh-gallery::

            interaction/tools
            interaction/js_callbacks

        .. interaction/linking
        .. interaction/legends
        .. interaction/widgets
        .. interaction/python_callbacks
        .. interaction/tooltips

.. _live tutorial notebooks: https://mybinder.org/v2/gh/bokeh/bokeh-notebooks/master?filepath=tutorial%2F00%20-%20Introduction%20and%20Setup.ipynb

In addition to the gallery here, there are more examples from GitHub repository.
To see a complete list with links to rendered plots, see the :ref:`example_index`.
