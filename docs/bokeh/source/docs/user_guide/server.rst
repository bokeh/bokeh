.. _ug_server:

Bokeh server applications
=========================

Bokeh server applications connect browser interactions to Python callbacks.
An application creates a document for each session. A host serves the pages,
assets and WebSocket connections that keep those documents synchronized.

Start with module apps for reusable Python code. Script apps offer a quick
way to try an idea or run an existing application. Both forms support direct
ASGI hosting. The ``bokeh serve`` command provides command-line hosting for
script apps using ASGI internally. Neither hosting approach requires a web
framework.

.. toctree::
    :maxdepth: 1

    server/server_introduction
    server/getting_started
    server/module_apps
    server/updating_data
    server/lifecycle
    server/script_apps
    server/script_to_module
    server/hosting
    server/frameworks
    server/deploy
    server/migration
