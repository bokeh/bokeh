.. _first_steps_8:

First steps 8: Providing and filtering data
===========================================

In the :ref:`previous first steps guides <first_steps_7>`, you used different
methods to display and export your visualizations.

In this section, you will use various sources and structures to import and
filter data.

.. _first_steps_8_column_data_source:

Using ColumnDataSource
----------------------

The :class:`~bokeh.models.sources.ColumnDataSource` is Bokeh's own data
structure. For details about the ``ColumnDataSource``, see |ColumnDataSource| in
the user guide.

So far, you have used data sequences like Python lists and NumPy arrays to pass
data to Bokeh. Bokeh has automatically converted these lists into
``ColumnDataSource`` objects for you.

Follow these steps to create a ``ColumnDataSource`` directly:

* First, import :class:`~bokeh.models.sources.ColumnDataSource`.
* Next, create a dict with your data: The dict's keys are the column names
  (strings). The dict's values are lists or arrays of data.
* Then, pass your dict as the ``data`` argument to
  :class:`~bokeh.models.sources.ColumnDataSource`:
* You can then use your ``ColumnDataSource`` as ``source`` for your
  renderer.

.. code-block:: python

    from bokeh.plotting import figure, show
    from bokeh.models import ColumnDataSource

    # create dict as basis for ColumnDataSource
    data = {'x_values': [1, 2, 3, 4, 5],
            'y_values': [6, 7, 2, 3, 6]}

    # create ColumnDataSource based on dict
    source = ColumnDataSource(data=data)

    # create a plot and renderer with ColumnDataSource data
    p = figure(height=250)
    p.scatter(x='x_values', y='y_values', size=20, source=source)
    show(p)

.. seealso::
   For more information on Bokeh's ``ColumnDataSource``, see
   |ColumnDataSource| in the user guide and
   :class:`~bokeh.models.sources.ColumnDataSource` in the reference guide.

   For information about adding data to a ColumnDataSource, see
   :ref:`ug_basic_data_cds_streaming`. Information about replacing data of a
   ColumnDataSource is available at :ref:`ug_basic_data_cds_patching` in the
   user guide.

   For more information on using Python lists, see
   :ref:`ug_basic_data_python_lists`. For more information on using NumPy
   data with Bokeh, see :ref:`ug_basic_data_numpy`.

Converting pandas data
^^^^^^^^^^^^^^^^^^^^^^

To use data from a pandas ``DataFrame``, pass your pandas data to a
``ColumnDataSource``:

.. code-block:: python

   source = ColumnDataSource(df)

.. seealso::
   For more information on using pandas data in Bokeh, see
   :ref:`ug_basic_data_cds_pandas_data_frame` in the user guide. This
   includes information on using pandas ``DataFrame``, ``MultiIndex``, and
   ``GroupBy`` data.

Filtering data
--------------

Bokeh comes with various filtering methods. Use these filters if you want to
create a specific subset of the data contained in your ColumnDataSource.

In Bokeh, these filtered subsets are called "views". Views are represented by
Bokeh's :class:`~bokeh.models.sources.CDSView` class.

To plot with a filtered subset of data, pass a ``CDSView`` object to the
``view`` argument of your renderer.

A :class:`~bokeh.models.sources.CDSView` object has one property:

* ``filter``: an instance of :class:`~bokeh.models.filters.Filter` models

The simplest filter is the :class:`~bokeh.models.filters.IndexFilter`. An
IndexFilter uses a list of index positions and creates a view that contains
nothing but the data points located at those index positions.

For example, if your ColumnDataSource contains a list of five values and you
apply an IndexFilter with ``[0,2,4]``, the resulting ``view`` contains only the
first, the third, and the fifth value of your original list:

.. literalinclude:: examples/first_steps_8_filter.py
   :language: python
   :emphasize-lines: 2,9,20

.. bokeh-plot:: docs/first_steps/examples/first_steps_8_filter.py
    :source-position: none

.. seealso::
   For more information on the various filters in Bokeh, see
   :ref:`ug_basic_data_filtering` in the user guide. More information is also
   available in the entries for :class:`~bokeh.models.sources.CDSView` and
   :class:`~bokeh.models.filters.Filter` in the reference guide.
