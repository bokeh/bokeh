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
What version of BokehJS to use when building sphinx docs.

To build and display the docs using a locally built BokehJS, set to ``local``.
For example:

.. code-block:: sh

    BOKEH_DOCS_CDN=local make clean serve

Will build a fresh copy of the docs using the locally built BokehJS and open
a new browser tab to view hem.

To build test docs to deploy to a one-off location on the docs site, set to
``test:<location>``. For example:

.. code-block:: sh

    BOKEH_DOCS_CDN=test:newthing make clean

will build docs that can be deployed with ``fab deploy:newthing``.

Otherwise, the value is interpreted a version for CDN:

.. code-block:: sh

    BOKEH_DOCS_CDN=0.12.7rc1 make clean

will build docs that use BokehJS version ``0.12.7rc1`` from CDN (whether viewed
locally or deployed to the docs site).

``BOKEH_DOCS_VERSION``
~~~~~~~~~~~~~~~~~~~~~~
What version of Bokeh to show when building sphinx docs locally. Useful if it
is necessay to re-deploy old docs with hotfixes.

``BOKEH_DOCS_CSS_SERVER``
-------------------------
Where to get the CSS stylesheet from, by default this will be bokehplots.com

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

``BOKEH_VALIDATE_DOC``
-----------------------
Whether to perform a validation check on the document before outputting.
Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.
Setting this variable to a negative value for a document that is known to be
correctly configured may yield performance improvements.

``BOKEH_VERSION``
-----------------
What version of BokehJS to use with ``cdn`` resources
See the :class:`~bokeh.resources.Resources` class reference for full details.

.. _webbrowser: https://docs.python.org/2/library/webbrowser.html
