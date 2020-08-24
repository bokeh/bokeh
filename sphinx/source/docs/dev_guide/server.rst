.. _devguide_server:

Server Architecture
===================

This chapter is a "deep dive" into Bokeh server's internals. It assumes you're
already familiar with the information on Bokeh server in :ref:`userguide_server`.

You might want to read this if you are:

- trying to work on the Bokeh codebase
- writing your own custom server process to use rather than ``bokeh serve``

A custom server process can add additional routes (web pages or
REST endpoints) using Tornado's web framework.

If an application developer uses ``bokeh serve``, they typically should not need
to import from ``bokeh.server`` at all. An application developer would only use
the ``Server`` class if it is doing something specialized, such as a custom
or embedded server process.

Applications, Sessions, and Connections
---------------------------------------

Each server contains one or more applications; you can think of an application
as a session template, or a factory for sessions. Sessions have a 1-1
relationship with instances of ``bokeh.document.Document``: each session has a
document instance. When a browser connects to the server, it gets a new
session; the application fills in the session's document with whatever plots,
widgets, or other content it desires. The application can also set up
callbacks, to run periodically or to run when the document changes.

Applications are represented by the ``Application`` class. This class
contains a list of ``Handler`` instances and optional metadata. Handlers
can be created in lots of ways: from JSON files, from Python functions, from
Python files, and perhaps many more ways in the future. The optional metadata
is available as a JSON blob via the ``/metadata`` endpoint. For example,
creating a ``Application`` instance with::

    Application(metadata=dict(hi="hi", there="there"))

will have ``http://server/myapp/metadata`` return (``application/json``)::

  {
      "data": {
          "hi": "hi",
          "there": "there"
      },
      "url": "/myapp"
  }

Around each application, the server creates an ``ApplicationContext``. Its
primary role is to hold the set of sessions for the application.

Sessions are represented by the class ``ServerSession``.

Each application has a route (called an ``app_path`` in the client
API), and each session has an ID. The combination of the two
specifies a ``Document`` instance (the server looks up the
application by path, and then looks up the session by ID).

Each session has 0-N connections, represented by the ``ServerConnection``
class. Connections are websocket connections. In general, sessions last as
long as they have connections, though they only expire after a timeout (to
allow for page reloads and the like).

Applications and application handlers cannot access the ``Server``
``ServerSession``, or ``ApplicationContext`` directly; they have a much more
limited interface defined in two pieces, ``ServerContext``  and
``SessionContext``. ``ServerContext`` presents a limited interface to some
aspects of ``ApplicationContext`` and ``Server``, while ``SessionContext``
presents a limited interface to some aspects of ``ServerSession``. Concrete
implementations of these interfaces are ``BokehServerContext`` and
``BokehSessionContext``.

Summarizing the object graph:

- ``Server`` implemented by ``BokehTornado``

 - has N ``ApplicationContext``

  - has 1 ``Application`` capable of creating new sessions
  - has 1 path used to identify it in URLs
  - has 1 ``ServerContext`` representing the aspects of
    the server visible to application code
  - has N ``ServerSession``

   - has 1 session ID which is a string naming the session
   - has 1 ``Document`` representing the session state
   - has N ``ServerConnection`` representing websockets
     attached to the session
   - has 1 ``SessionContext`` representing the aspects of
     the session visible to application code

Tornado ``IOLoop`` and Async Code
---------------------------------

To work on the server, you'll need an understanding of Tornado's
``IOLoop`` and the ``tornado.gen`` module.

The Tornado documentation will be the best resource, but here are
some quick things to know:

- The Bokeh server is single-threaded, so it's important not to
  write "blocking" code, meaning code that uses up the single
  thread while it waits for IO or performs a long computation. If
  you do this, you'll rapidly increase the latency seen by users
  of your application. For example, if you block for 100ms every
  time someone moves a slider, and ten users are doing this at
  once, users could easily see 10*100ms=1s of lag with only
  ten users.
- In Tornado, non-blocking code is modeled with functions or
  methods that return an instance of the ``Future`` class. You
  may have seen the ``@gen.coroutine`` decorator. This decorator
  transforms the decorated method into a method which returns a
  ``Future``.
- When no code is running, Tornado waits in its ``IOLoop``
  (sometimes called a "main loop" or "event loop"), which means
  it's waiting for something to happen. When something happens,
  ``IOLoop`` executes any callbacks that were interested in that
  event.

Applications and the ``IOLoop``
-------------------------------

We don't want applications to touch the Tornado ``IOLoop``
directly to add callbacks, because when a session expires or an
application is reloaded, we need the ability to remove all
callbacks belonging to a session or application.

To enable this, applications should only add callbacks using the
APIs on ``Document`` and ``ServerContext``. Methods on those
classes allow applications to ``add_periodic_callback``,
``add_timeout_callback``, and ``add_next_tick_callback``. We
intercept these callback additions and are able to remove them
when we unload an application or destroy a session.

Lifecycle
---------

If you look at the ``Application`` class, there are two ways the
server can call into it.

1. the ``modify_document()`` method which does just what it says: it
   passes in the session's ``Document`` and allows the application
   to modify it (perhaps adding some plots and widgets).
2. a set of "hooks" ``on_server_loaded()``, ``on_server_unloaded()``,
   ``on_session_created()``, ``on_session_destroyed()``.

The "hooks" are called "lifecycle hooks" since they happen at
defined points in the lifetime of an application and a session.

Here are the steps in the lifecycle:

1. When the server process starts up, it calls
   ``on_server_loaded()`` on each application.
2. When a client connects with a previously-unused session ID, the
   server creates a ``ServerSession`` and calls
   ``on_session_created()`` with an empty ``Document``, then
   ``modify_document()`` to initialize the ``Document``. The
   ``on_session_created()`` can also initialize part of the
   ``Document`` if it likes. ``on_session_created()`` happens before
   ``modify_document()``.
3. When there are no connections to a session, it will eventually
   time out, and ``on_session_destroyed()`` will be called.
4. If the server process shuts down cleanly, it will call
   ``on_server_unloaded()`` on each application. This is probably
   rare in production: it's typical for server processes to be
   killed by a signal.  ``on_server_unloaded()`` may be more useful
   during development so that apps can be reloaded without leaking
   resources.

These hooks can add periodic or one-shot callbacks to the
``ServerContext``. These callbacks may be asynchronous (using
Tornado's async IO facilities) and are able to update all live
session documents.

**Critical consideration when using ``on_server_loaded()``**:
Process-global is NOT the same as cluster-global. If you scale a
Bokeh application, you'll want a separate process for each CPU
core, roughly. Processes in a cluster may not even be on the same
machine. A server process can never assume that it knows about
"all sessions that exist," only "all sessions hosted in this
process."

Details of ``ServerSession``
----------------------------

The session object handles most interaction between the client and
the server.

Locking
^^^^^^^

The trickiest aspect of ``ServerSession`` may be locking. In general, we
want one callback or one websocket request to be processed at a time; we
don't want to interleave them, because it would be difficult to implement
callbacks and request handlers if they had to worry about interleaving.

So ``ServerSession`` does one thing at a time, controlled by
``ServerSession._lock``, which is a Tornado lock.

If you're familiar with locking and threads, the situation here is conceptually
identical; but race conditions can only happen at "yield points" (when we
return to the ``IOLoop``) rather than at any point, and the lock is a Tornado
lock rather than a thread lock.

The rule is: *to touch* ``ServerSession.document`` *code must
hold* ``ServerSession._lock``.

For callbacks added through the ``Document`` API, we automatically
acquire the lock on the callback's behalf before we execute the
callback, and release it afterward.

Callbacks added through the ``ServerContext`` API, can only obtain
a reference to the session document using ``SessionContext.with_locked_document()``.
It executes a provided function with
the document lock held, passing the document to that function.

.. warning::
  The lock is held while the function runs *even if the function is asynchronous*! If the
  function returns a ``Future``, the lock is held until the ``Future``
  completes.

**It is very easy to modify the server code in such a way that you're
touching the document without holding the lock. If you do this, things will
break in subtle and painful-to-debug ways. When you touch the session document,
triple-check that the lock is held.**

Session Security
^^^^^^^^^^^^^^^^

We rely on session IDs being cryptographically random and difficult to guess.
If an attacker knows someone's session ID, they can eavesdrop on or modify
the session. If you're writing a larger web app with a Bokeh app embedded
inside, this may affect how you design your larger app.

When hacking on the server, for the most part session IDs are opaque strings,
and after initially validating the ID, it doesn't matter to the server code
what the ID is.

Session Timeout
^^^^^^^^^^^^^^^^

To avoid resource exhaustion, unused sessions will time out according to code
in ``application_context.py``

Websocket Protocol
------------------

The server has a websocket connection open to each client (each browser tab,
in typical usage). The primary role of the websocket is to keep the session's
``Document`` in sync between the client and the server.

There are two client implementations in the Bokeh codebase: one is a Python
``ClientSession``, the other is a JavaScript ``ClientSession``.
Client and server sessions are mostly symmetrical. On both sides, we are
receiving change notifications from the other side's ``Document``, and sending
notification of changes made on our side. In this way, the two ``Document``
are kept in sync.

The Python implementation of the websocket protocol can be found in
``bokeh.server.protocol``, though both the client side and the server side
use it.

Websockets already implement "frames" for us, and they guarantee frames will
arrive in the same order they were sent. Frames are strings or byte arrays
(or special internal frame types, such as pings). A websocket looks like
two sequences of frames, one sequence in each direction ("full duplex").

On top of websocket frames, we implement our own ``Message`` concept. A Bokeh
``Message`` spans multiple websocket frames. It always contains a header frame,
metadata frame, and content frame. These three frames each contain a JSON
string. The code permits these three frames to be followed by optional binary data
frames. In principle, this could allow, for example, for sending NumPy arrays
directly from their memory buffers to the websocket with no additional copies.
However, the binary data frames are not yet used in Bokeh.

The header frame indicates the message type and gives messages an ID. Message
IDs are used to match replies with requests (the reply contains a field saying
"I am the reply to the request with ID xyz").

The metadata frame has nothing in it for now but could be used for debugging
data or for another purpose in the future.

The content frame has the "body" of the message.

There aren't many messages right now. A quick overview:

- ``ACK`` is used for an initial handshake when setting up the connection
- ``OK`` is a generic reply when a request doesn't require any
  more specific reply
- ``ERROR``  is a generic error reply when something goes wrong
- ``SERVER-INFO-REQ`` and ``SERVER-INFO-REPLY`` are a
  request-reply pair where the reply contains information about
  the server, such as its Bokeh version
- ``PULL-DOC-REQ`` asks to get the entire contents of the
  session's ``Document`` as JSON, and ``PULL-DOC-REPLY`` is the
  reply containing said JSON.
- ``PUSH-DOC`` sends the entire contents of the session's
  ``Document`` as JSON, and the other side should replace its
  document with these new contents.
- ``PATCH-DOC`` sends changes to the session's document to the
  other side

Typically, when opening a connection, one side will pull or push
the entire document; after the initial pull or push, the two sides
stay in sync using ``PATCH-DOC`` messages.

Some Current Protocol Caveats
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

1. In the current protocol, conflicts where both sides change the
   same thing at the same time are not handled (the two sides can
   end up out-of-sync if this happens, because the two
   ``PATCH-DOC`` are in flight at the same time). It's easy to
   devise a scheme to detect this situation, but it's less clear
   what to do when it's detected, so right now, we don't detect it
   and do nothing. In most cases, applications should avoid this
   situation because even if we could make sense of it and handle
   it somehow, it would probably be inefficient for the two sides
   of the app to "fight" over the same value. (If real-world
   applications trip on this issue, we will have to figure out
   what they're trying to do and devise a solution.)

2. At the moment, we are not smart about patching collections; if
   there's a ``Model`` property that's a giant dictionary, we'll
   send the whole giant dictionary whenever any entry in it
   changes.

3. At the moment, we do not optimize binary data by sending it
   over binary websocket frames. However, NumPy arrays of
   dtype ``float32``, ``float64``, and integer types smaller than ``int32``
   are base64 encoded in a content frame to avoid performance
   limitations of naive JSON string serialization.
   JavaScript's lack of native 64-bit integer support precludes
   them from inclusion in this optimization.
   The base64 encoding should be entirely transparent to all
   but those who look at the actual wire protocol. For more
   information, refer to ``bokah.util.serialization``.


HTTP Endpoints
--------------

The server only supports a few HTTP routes; you can find them in
``bokeh.server.urls``.

In brief:

- ``/static/`` serves Bokeh's JS and CSS resources
- ``/app_path/`` serves a page that displays a new session
- ``/app_path/ws`` is the websocket connection URL
- ``/app_path/autoload.js`` serves a chunk of JavaScript that
  backs the ``bokeh.embed.server_document()`` and ``bokeh.embed.server_session()``
  functionality

Bokeh server isn't intended to be a general-purpose web framework. You can,
however, pass new endpoints to ``Server`` using the ``extra_patterns`` parameter
and the Tornado APIs.

Additional Details
------------------

Events
^^^^^^

In general, whenever a model property is modified, the new value is
first validated, and the ``Document`` is notified of the change. Just
as models may have ``on_change`` callbacks, so can a
``Document``. When a ``Document`` is notified of a change to one of
its models, it will generate the appropriate event (usually a
``ModelChangedEvent``) and trigger the ``on_change`` callbacks,
passing them this new event. Sessions are one such callback, which
will turn the event into a patch that can be sent across the web
socket connection. When a message is received by the client or server
session, it will extract the patch and apply it directly to the
``Document``.

In order to avoid events bouncing back and forth between client and
server (as each patch would generate new events, which would in turn
be sent back), the session informs the ``Document`` that it was
responsible for generating the patch and any subsequent events that
are generated. In this way, when a ``Session`` is notified of a change
to the document, it can check whether the ``event.setter`` is identical
with itself and therefore skip processing the event.

Serialization
^^^^^^^^^^^^^

In general, all the concepts above are agnostic as to how precisely the
models and change events are encoded and decoded. Each model and its
properties are responsible for converting their values to a JSON-like
format, which can be sent across the websocket connection. One
difficulty here is that one model can reference other models, often in
highly interconnected and even circular ways. Therefore, during the
conversion to a JSON-like format, all references by one model to other
models are replaced with ID references. Additionally, models and
properties can define special serialization behavior. One such
example is the ``ColumnData`` property on a ``ColumnDataSource``,
which will convert NumPy arrays to a base64 encoded representation,
which is significantly more efficient than sending numeric arrays in a
string-based format. The ``ColumnData`` property
``serializable_value`` method applies this encoding, and the from_json
method will convert the data back. Equivalently, the JS-based
``ColumnDataSource`` knows how to interpret the base64 encoded data
and converts it to JavaScript typed arrays, and its
``attributes_as_json`` methods also knows how to encode the data. In
this way, models can implement optimized serialization formats.


Testing
-------

To test client-server functionality, use the utilities in
``bokeh.server.tests.utils``.

Using ``ManagedServerLoop``, you can start up a server instance
in-process. Share ``server.io_loop`` with a client, and you can
test any aspect of the server. Check out the existing tests for
lots of examples. Anytime you add a new websocket message or HTTP
endpoint, be sure to add tests!
