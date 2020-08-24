.. _devguide_envvars:

Environment Variables
=====================

Most of the environment variables that can be set to affect Bokeh operation
are described in the :ref:`bokeh.settings` reference guide. In addition to
those, there is a ``BOKEH_DEV`` environment variable that may be useful to
set for local development.

Setting ``BOKEH_DEV=true`` is equivalent to setting all of the following
individually:

- ``BOKEH_BROWSER=none``
- ``BOKEH_LOG_LEVEL=debug``
- ``BOKEH_MINIFIED=false``
- ``BOKEH_PRETTY=true``
- ``BOKEH_PY_LOG_LEVEL=debug``
- ``BOKEH_RESOURCES=absolute-dev``

In general this ensure local, unminified BokehJS resources are used, ups the
default log levels, and makes generated HTML and JSON more human-readable

.. note::
    When running server and notebook examples, the ``BOKEH_RESOURCES``
    setting that ``BOKEH_DEV`` sets will cause rendering problems.

    We recommend manually setting ``BOKEH_RESOURCES`` to ``server``
    for server work, and ``inline`` for notebooks (other
    :class:`~bokeh.resources.Resources` settings may also work).
