.. _bokeh.models:

bokeh.models
============

One of the central design principals of Bokeh is that, regardless of
how the plot creation code is spelled in Python (or other languages),
the result is an object graph that encompasses all the visual and
data aspects of the scene. Furthermore, this *scene graph* is to be
serialized, and it is this serialized graph that the client library
BokehJS uses to render the plot. The low-level objects that comprise
a Bokeh scene graph are called :ref:`Models <bokeh.model>`.

This reference documents all the Bokeh models, together with their
property attributes, as well as a JSON prototype illustrating what
a serialized version of the model looks like.

.. toctree::
   :maxdepth: 3
   :glob:

   models/*
