.. _tutorials:

Tutorials
=========

.. _about:

This tutorial covers the Bokeh "high level" interface. It will present
a number of basic exercises to get you started using Bokeh to visualize
your data, as well as some more topical and advanced exercises to show
how to use Bokeh in particular cases.

.. include:: ../docs/includes/gallery_hero.txt

Bokeh has many interesting and important features that are outside this scope
of this current tutorial:

* Matplotlib compatibility
* "Low level" glyph interface that mirrors BokehJS
* Using BokehJS as a standalone javascript library
* Using the Bokeh server, for

  - plot persistence
  - streaming/updating data to visualizations
  - abstract rendering or intelligent downsampling

* sharing/embedding Bokeh plots
* animated plots

These are intended to be added in the near future, any help with adding to Bokeh
documentation is appreciated!

----

All the exercises in this tutorial have solutions. Please click the "See the solution"
link at the bottom of any exercise to view it. All of the solutions include live plots
that you may view and interact with.

Each exercise is presented as a partial script with portions for you to fill. These are
marked in comments with instructions, such as:

.. code-block:: python

    # EXERCISE: finish this line plot, and add more for the other stocks. Each one
    # should have a legend, and its own color.

These lines are highlighted inline in the source in this document. You may also find
a text `.py` file version of the exercise and the location listed at the top of
each exercise.

Please refer often to the documentation at http://bokeh.pydata.org/en/latest
especially the :ref:`userguide`.

----

.. toctree::
   :maxdepth: 2

   tutorials/basic.rst
   tutorials/topical
   tutorials/advanced
   tutorials/more_info


