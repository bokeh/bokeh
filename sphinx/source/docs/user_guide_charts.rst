.. _userguide_charts:

High Level Charts
=================

.. contents::
    :local:
    :depth: 2


The main idea behind the ``bokeh.charts`` interface is to help the users to easily get their plot
using a very high level API.

Currently the ``bokeh.charts`` interface supports:

* ``Histograms`` (grouped)
* ``Bar plots`` (grouped and stacked)
* ``Scatter plots`` (grouped and stacked)

To use it, you only have to import the ``Bokeh`` chart of interest from ``bokeh.charts``::

    from bokeh.charts import Histogram

initialize your plot with some specific arguments (for chart customization)::

    hist = Histogram(normal_dist, bins=50, mu=mu, sigma=sigma,
                     title="kwargs, dict_input", ylabel="frequency", legend="top_left",
                     width=400, height=350, notebook=True)

and finally call the ``show()`` method::

    hist.show()

.. image:: /_images/histogram.png
    :align: center

Generic arguments and chained methods
-------------------------------------

You can pass some arguments when you instantiate the class, as we shown you before, or you can use
chained methods as we shown below::

    hist = Histogram(distributions, bins=50, notebook=True)
    hist.title("chained_methods, dict_input").ylabel("frequency").legend(True).width(400).height(350).show()

.. note:: Be aware that the ``show()`` method can not be chained. It has to be called at the end of your chain.

Available arguments and chained methods are:

* ``title``, string type, to add a title to your chart
* ``xlabel``, string type, to label the x axis
* ``ylabel``, string type, to label the y axis
* ``legend``, string type, it can be `top_left`, `top_right`, `bottom_left`, `bottom_right`. The legend content is inferred from incoming input.
* ``width``, int type, to set the chart width
* ``height``, int type, to set the chart height
* ``tools``, bool type, to setup (or avoid) the tools in your chart

Specific arguments
------------------

In some charts, you can pass specific arguments which only makes sense in an specific chart context.

For instance, in the Histogram chart, you need to set up the ``bins`` and, additionally, you can pass a ``mu`` and ``sigma``
to get the ``pdf`` and the ``cdf`` line plots of theoretical normal distributions for these parameters.

In the Bar charts case, if you pass several groups, they will be shown ``grouped`` by default:

.. image:: /_images/bargrouped.png
    :align: center

But if you specify the argument ``stacked`` as True, it will be shown as stacked bars as follow:

.. image:: /_images/barstacked.png
    :align: center

Interface inputs
''''''''''''''''

The ``bokeh.charts`` interface is ready to get your input as, essentially, ``OrderedDict`` and pandas ``dataframe objects``
(also pandas ``groupby objects`` in some cases). The idea behind this canonical format is to easily represent groups of
data and easily plot them through the interface.

Let see some examples using different kind of inputs.

* Using ``OrderedDict``::

    from collections import OrderedDict

    from bokeh.charts import Scatter
    from bokeh.sampledata.iris import flowers

    setosa = flowers[(flowers.species == "setosa")][["petal_length", "petal_width"]]
    versicolor = flowers[(flowers.species == "versicolor")][["petal_length", "petal_width"]]
    virginica = flowers[(flowers.species == "virginica")][["petal_length", "petal_width"]]

    xyvalues = OrderedDict([("setosa", setosa.values), ("versicolor", versicolor.values), ("virginica", virginica.values)])

    scatter = Scatter(xyvalues)
    scatter.title("iris dataset, dict_input").xlabel("petal_length").ylabel("petal_width").legend("top_left").width(600).height(400).notebook().show()

.. image:: /_images/scatter.png
    :align: center

* Using a ``hierarchical`` pandas ``dataframe``::

    import pandas as pd

    xyvalues = OrderedDict([("setosa", setosa), ("versicolor", versicolor), ("virginica", virginica)])

    df = pd.concat(xyvalues, axis=1, names=["l0", "l1"])

    scatter = Scatter(df)
    scatter.title("iris dataset, df_input").legend("top_left").width(600).height(400).notebook().show()

* Using a pandas ``groupby`` object::

    from bokeh.charts import Scatter
    from bokeh.sampledata.iris import flowers

    df = flowers[["petal_length", "petal_width", "species"]]
    g = df.groupby("species")

    scatter = Scatter(g)
    scatter.title("iris dataset, gp_by_input").legend("top_left").width(600).height(400).notebook().show()

As you can see, in the last two cases, we inferred the ``x`` and ``y`` labels from the pandas object, so you have not to be aware
of specifying them by yourself.

.. note:: For plotting just one group you can build a simple ``OrderedDict``
          having the group of interest and pass this object to the interface, ie::

              mu, sigma = 0, 0.5
              normal = np.random.normal(mu, sigma, 1000)
              normal_dist = OrderedDict(normal=normal)

Interface outputs
-----------------

As with the low and middle level ``Bokeh`` plotting APIs, in ``bokeh.charts``, we also support the chart output to a file::

    hist = Histogram(distributions, bins=50, filename="my_plot")

* ``filename``, string type, the name of your chart. If you pass ``True`` to this argument (or chained method) it will use ``untitled`` as a filename)

to the ``bokeh-server``::

    hist = Histogram(distributions, bins=50, server=True)

* ``server``, string type, the name of your chart in the server. If you pass ``True`` to this argument (or chained method) it will use ``untitled`` as a server name)

and to the IPython notebook::

    hist = Histogram(distributions, bins=50, notebook=True)

* ``notebook``, bool type, if you want to output (or not) to the notebook.

Keep in mind that, as with any other ``Bokeh`` plots in the IPython notebook, you have to load the ``BokehJS`` library into the notebook just doing::

    import bokeh
    bokeh.load_notebook()

.. note:: You can output to any or all of these 3 possibilities because, right now, they are not mutually exclusive.
