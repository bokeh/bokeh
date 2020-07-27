.. _devguide_bindings:

Language Bindings
=================

Because the input accepted by BokehJS is an object graph represented by
declarative bits of JSON, any language that can generate the right JSON
can generate Bokeh plots in the browser.

Resources for Authors
---------------------

Since the low-level object interface in Python mirrors the JSON schema
exactly, the best, most authoritative source of information for anyone
writing bindings for Bokeh are the reference guide sections for the
:ref:`bokeh.core.properties` and :ref:`bokeh.models`. In
particular, the models reference has a JSON prototype for every model
in the Bokeh object system.

Additionally, there is a very low-traffic ``bokeh-dev`` mailing list
that is intended to be a high-signal communication channel for Bokeh
language binding developers. If you are interested in being added to
this mailing list, please contact us.

Known Bindings
--------------

These are the currently known projects that expose Bokeh to languages
other than Python. If you know of any that are not on this list, or if
you want to work on a new language binding for Bokeh and need some help,
please let us know.

rbokeh
  The `rbokeh <bokeh_r_>`_ project, started by `@hafen <hafen_>`_, adds support
  for Bokeh to the R language.

bokeh.jl
  Originally created by `@samuelcolvin <samuelcolvin_>`_, the
  `bokeh.jl <bokeh_jl_>`_ project brings Bokeh to Julia users.

  **The bokeh.jl binding is currently unmaintained**. If you are interested in
  picking up the bokeh.jl work, please contact the core devs.

bokeh-scala
  The `bokeh-scala <bokeh_scala_>`_ exposes Bokeh in the Scala language. The
  project was created by the Bokeh core dev team's own `@mattpap <mattpap_>`_.

.. _bokeh_jl: https://github.com/bokeh/Bokeh.jl
.. _bokeh_r: http://hafen.github.io/rbokeh/
.. _bokeh_scala: https://github.com/bokeh/bokeh-scala
.. _hafen: https://github.com/hafen
.. _mattpap: https://github.com/mattpap
.. _samuelcolvin: https://github.com/samuelcolvin
