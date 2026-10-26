.. _ug_server_lifecycle:
.. _ug_server_apps_hooks:

Managing lifecycle and concurrency
==================================

A document and its callbacks belong to a session. A producer shared by all
sessions belongs to the application or host.

.. _ug_server_session_cleanup:

Session cleanup
---------------

Register ``doc.on_session_destroyed(callback)`` to release resources owned by
a session. Stop background threads and close devices or files when that session
ends. Do not create an unbounded producer every time a browser reconnects.

See :bokeh-tree:`examples/server/module_apps/lifecycle/lock_document_callbacks`.
Its session owns a producer thread and a stop event. The cleanup callback tells
the producer to exit.

Document locking
----------------

Use document callbacks to change models from background work. The example uses
``doc.locked_callback(policy="latest")`` to schedule updates while holding the
document lock and discard superseded updates. Do not write to models directly
from an unrelated worker thread.

Synchronous session construction and callbacks run in workers. Async callbacks
run on the event loop. Keep process-wide mutable state protected when workers
can access it concurrently.

Application lifecycle
---------------------

An explicit ``Application`` subclass can implement ``on_server_loaded`` and
``on_server_unloaded``. It can also implement async ``on_session_created`` and
``on_session_destroyed`` methods. When overriding session hooks, call and
await the corresponding ``super()`` method so application handlers also run.

* :bokeh-tree:`examples/server/module_apps/lifecycle/track_stocks` loads bundled
  price data once and gives each document its own models.
* :bokeh-tree:`examples/server/module_apps/lifecycle/display_live_audio` starts
  one audio producer and stops it when the application shuts down. It uses
  synthesized audio when PyAudio is unavailable.

.. _ug_server_shared_data:

Shared data
-----------

Keep shared computation separate from per-session models. Publish snapshots
that each document can apply to its own data sources. A shared producer belongs
to the host's lifecycle, not to an arbitrary viewer's session.

See :bokeh-tree:`examples/server/module_apps/updating_data/share_data_between_sessions`.
Its framework-free host starts one producer and cancels it on shutdown.
``BokehASGI.update_sessions()`` applies a snapshot under each document's lock.
The FastAPI version reuses the same application and producer:
:bokeh-tree:`examples/server/module_apps/frameworks/share_data_with_fastapi/server.py`.

Shared Python state is local to one process. Multiple workers need an external
data service or a way to deliver updates to each worker.

.. _ug_server_asgi_lifespan:

ASGI lifespan
-------------

An ASGI server sends startup and shutdown events to the application it runs.
When it runs ``BokehASGI`` directly, Bokeh uses these events to start and stop
its application core.

Some frameworks do not send lifespan events to mounted applications. In that
case, the parent application must await ``bokeh_app.core.start()`` during startup
and ``bokeh_app.core.stop()`` during shutdown. Start shared producers after Bokeh
starts and stop them before Bokeh shuts down. Ensure cleanup still runs if a
producer fails.

See :ref:`ug_server_frameworks` for a FastAPI lifespan that owns a mounted Bokeh
application. The shared-data example above also owns a producer task.
