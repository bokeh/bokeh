.. _devguide_envvars:

Environment Variables
=====================

There are several environment variables that can be useful for developers:

``BOKEH_BROWSER``
-----------------
What browser to use when opening plots
Valid values are any of the browser names understood by the python
standard library webbrowser_ module.

``BOKEH_DEV``
--------------
Whether to use development mode
This uses absolute paths to development (non-minified) BokehJS components,
sets logging to ``debug``, makes generated HTML and JSON human-readable,
etc.

This is a meta variable equivalent to the following environment variables:

- ``BOKEH_BROWSER=none``
- ``BOKEH_LOG_LEVEL=debug``
- ``BOKEH_MINIFIED=false``
- ``BOKEH_PRETTY=true``
- ``BOKEH_PY_LOG_LEVEL=debug``
- ``BOKEH_RESOURCES=absolute-dev``
- ``BOKEH_SIMPLE_IDS=true``

Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.

``BOKEH_DOCS_CDN``
--------------------
What version of BokehJS to use when building sphinx docs locally.

.. note::
    Set to ``"local"`` to use a locally built dev version of BokehJS.

    This variable is only used when building documentation from the
    development version.

``BOKEH_DOCS_VERSION``
~~~~~~~~~~~~~~~~~~~~~~
What version of Bokeh to show when building sphinx docs locally. Useful for re-deployment purposes.

.. note::
    Set to ``"local"`` to use a locally built dev version of BokehJS.

    This variable is only used when building documentation from the
    development version.

``BOKEH_DOCS_CSS_SERVER``
-------------------------
Where to get the css stylesheet from, by default this will be bokehplots.com

.. note::
    This variable is only used when building documentation from the
    development version.

``BOKEH_LOG_LEVEL``
-------------------
The BokehJS console logging level to use Valid values are, in order of increasing severity:

  - ``trace``
  - ``debug``
  - ``info``
  - ``warn``
  - ``error``
  - ``fatal``

The default logging level is ``info``.

.. note::
    When running server examples, it is the value of this
    ``BOKEH_LOG_LEVEL`` that is set for the server that matters.

``BOKEH_MINIFIED``
-------------------
Whether to emit minified JavaScript for ``bokeh.js``
Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.

``BOKEH_PRETTY``
-----------------
Whether to emit "pretty printed" JSON
Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.

``BOKEH_PY_LOG_LEVEL``
-----------------------
The Python logging level to set
As in the JS side, valid values are, in order of increasing severity:

  - ``debug``
  - ``info``
  - ``warn``
  - ``error``
  - ``fatal``
  - ``none``

The default logging level is ``none``.

``BOKEH_RESOURCES``
--------------------
What kind of BokehJS resources to configure
For example:  ``inline``, ``cdn``, ``server``. See the
:class:`~bokeh.resources.Resources` class reference for full details.

``BOKEH_ROOTDIR``
------------------
Root directory to use with ``relative`` resources
See the :class:`~bokeh.resources.Resources` class reference for full
details.

``BOKEH_SIMPLE_IDS``
-----------------------
Whether to generate human-friendly object IDs
Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.
Normally Bokeh generates UUIDs for object identifiers. Setting this variable
to an affirmative value will result in more friendly simple numeric IDs
counting up from 1000.

``BOKEH_VERSION``
-----------------
What version of BokehJS to use with ``cdn`` resources
See the :class:`~bokeh.resources.Resources` class reference for full details.

.. _webbrowser: https://docs.python.org/2/library/webbrowser.html
