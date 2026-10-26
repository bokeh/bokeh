.. _ug_server_apps:
.. _ug_server_script_apps:

Using script apps
=================

Script apps are convenient for quick experiments and existing applications.
For reusable Python code, start with :ref:`ug_server_module_apps`.

A script uses :func:`~bokeh.io.curdoc` to access its session document:

.. code-block:: python

    from bokeh.io import curdoc
    from bokeh.models import Div

    curdoc().add_root(Div(text="Hello"))

Save it as ``hello.py`` and run ``bokeh serve hello.py --show``. Bokeh executes
the script for each new session. No web framework is needed. The CLI uses
framework-free ASGI underneath.

The flat collection :bokeh-tree:`examples/server/script_apps` includes sliders,
events, data updates, themes and directory apps. For example:

.. code-block:: sh

    bokeh serve examples/server/script_apps/adjust_plot_with_sliders.py --show

.. _ug_server_apps_directory:

Directory apps
--------------

A directory app contains ``main.py`` and may include these files:

.. code-block:: text

    my_app/
      main.py
      __init__.py
      app_hooks.py
      theme.yaml
      templates/
        index.html
      static/
        style.css

Run ``bokeh serve my_app``. Bokeh discovers the theme, template, static directory
and hooks. Use ``__init__.py`` when the app imports helper modules relatively.
``server_lifecycle.py`` supports lifecycle hooks as an alternative.
Request hooks such as ``process_request`` require ``app_hooks.py``.
Do not provide both files. Notebook application files are not supported by the
CLI.

.. _ug_server_cli:

Command-line hosting
--------------------

.. code-block:: sh

    bokeh serve first.py second.py --port 8080 --prefix /tools
    bokeh serve my_app --args one two

The application URL uses the script or directory name. ``--show`` opens it in
a browser. ``--args`` must be last and supplies script arguments. Use
``bokeh serve --help`` for the full option list.

Use ``--auth-policy module:attribute`` to load an AuthPolicy instance.
``BOKEH_AUTH_POLICY`` supplies the same setting through the environment.
Import failures stop startup. See :ref:`ug_server_hosting` for the policy
contract. The script example uses:

.. code-block:: sh

    bokeh serve examples/server/script_apps/authenticate_users --auth-policy examples.server.script_apps.authenticate_users.auth:policy --exclude-headers Authorization

Set ``APP_ACCESS_TOKEN`` before running this example. Enable session signing
and TLS for authenticated deployment as described in :ref:`ug_server_hosting`.

Script apps through ASGI
------------------------

``BokehASGI({"/plot": path})`` can load the same script or directory. This
changes the host while retaining script-loading conventions. See
:ref:`ug_server_script_to_module` to change the application form instead.
