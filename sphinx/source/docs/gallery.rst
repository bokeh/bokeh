:orphan:

.. _gallery:

Gallery
#######

.. _gallery_server_examples:

Server App Examples
===================

The examples linked below all show off usage of the Bokeh server. The
Bokeh server provides a place where interesting things can happen---data
can be updated to in turn update the plot, and UI and selection events
can be processed to trigger more visual updates.

.. raw:: html

    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
    <style type="text/css">
        .row { margin-top: 1em}
        #gallery, #server-app-examples { overflow-x: visible }
    </style>

    <div class="row">

    <div class="col-sm-6">
      <div class="row">
        <div class="col-sm-6">
          <a target="_blank" href="//demo.bokehplots.com/apps/movies">
          <img src="http://bokeh.pydata.org/static/movies_t.png" class="img-responsive img-thumbnail">
          </a>
        </div>
        <div class="col-sm-6">
          <p>
            An interactive query tool for a set of IMDB data
          </p>
          <p>
            <em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/blob/master/examples/app/movies">movies</a>
          </p>
        </div>
      </div>
    </div>

    <div class="col-sm-6">
      <div class="row">
        <div class="col-sm-6">
          <a target="_blank" href="//demo.bokehplots.com/apps/selection_histogram">
            <img src="http://bokeh.pydata.org/static/selection_histogram_t.png" class="img-responsive img-thumbnail">
          </a>
        </div>
        <div class="col-sm-6">
          <p>
            Shows axis histograms for selected <em>and</em> nonselected points in a scatter plot
          </p>
          <p>
            <em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/blob/master/examples/app/selection_histogram.py">selection_histogram</a>
          </p>
        </div>
      </div>
    </div>

    </div>


    <div class="col-sm-6">
      <div class="row">
        <div class="col-sm-6">
          <a target="_blank" href="//demo.bokehplots.com/apps/weather">
            <img src="http://bokeh.pydata.org/static/weather_t.png" class="img-responsive img-thumbnail">
          </a>
        </div>
        <div class="col-sm-6">
          <p>
            Interactive weather statistics for three cities.
          </p>
          <p>
            <em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh-demos/tree/master/weather">weather</a>
          </p>
        </div>
      </div>
    </div>

    <div class="row">

    <div class="col-sm-6">
      <div class="row">
        <div class="col-sm-6">
          <a target="_blank" href="//demo.bokehplots.com/apps/sliders">
            <img src="http://bokeh.pydata.org/static/sliders_t.png" class="img-responsive img-thumbnail"></img>
          </a>
        </div>
        <div class="col-sm-6">
          <p>
            A basic demo that has sliders for controlling a plotted trigonometric function
          </p>
          <p>
            <em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/blob/master/examples/app/sliders.py">sliders.py</a>
          </p>
        </div>
      </div>
    </div>

    </div>

    <div class="col-sm-6">
      <div class="row">
        <div class="col-sm-6">
          <a target="_blank" href="//demo.bokehplots.com/apps/timeout">
            <img src="http://bokeh.pydata.org/static/timeout_t.png" class="img-responsive img-thumbnail">
          </a>
        </div>
        <div class="col-sm-6">
          <p>
            An updating plot that demonstrates using timeout callbacks in Bokeh server apps
          </p>
          <p>
            <em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/blob/master/examples/app/timeout.py">timeout.py</a>
          </p>
        </div>
      </div>
    </div>

    <div class="col-sm-6">
      <div class="row">
        <div class="col-sm-6">
          <a target="_blank" href="//demo.bokehplots.com/apps/random_tiles">
            <img src="http://bokeh.pydata.org/static/random_tiles_t.png" class="img-responsive img-thumbnail"></img>
          </a>
        </div>
        <div class="col-sm-6">
          <p>
            A user-defined extension showing randomized tiles.
          </p>
          <p>
            <em>Source code: </em><a target="_blank" href="https://github.com/bokeh/bokeh/blob/master/examples/app/random_tiles">random_tiles</a>
          </p>
        </div>
      </div>
    </div>



.. _gallery_notebook_examples:

Notebook Examples
=================

A large number of static examples may be viewed directly online (or
downloaded and executed locally) at the `Bokeh NBViewer Gallery`_.


.. _gallery_static_examples:

Standalone Examples
===================

All of the examples below are located in the :bokeh-tree:`examples`
subdirectory of your Bokeh checkout. By "standalone" we mean that
these examples make no use of the Bokeh server. These plots still
have many interactive tools and features, including linked panning
and brushing, and hover inspectors.

Click on an image below to see its code and interact with the live
plot.

.. cssclass:: gallery clearfix

.. bokeh-gallery:: main_gallery.json

.. _Bokeh NBViewer Gallery: http://nbviewer.ipython.org/github/bokeh/bokeh-notebooks/blob/master/index.ipynb
