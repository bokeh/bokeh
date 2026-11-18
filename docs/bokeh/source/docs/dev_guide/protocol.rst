.. _contributor_guide_protocol:

Protocol
========

Bokeh (Python) and :term:`BokehJS` communicate by exchanging JSON documents
that describe object graphs of models. The same representation is used in
several places:

* :ref:`messages <contributor_guide_protocol_messages>` exchanged between a
  Bokeh server and its clients over a WebSocket connection,
* :ref:`serialized documents <contributor_guide_protocol_documents>`
  (``DocJson``) sent in those messages, embedded in HTML pages and notebooks,
  or used on their own,
* :ref:`embed payloads <contributor_guide_protocol_embed>`
  (``bokeh.embed/v1``) accepted by ``Bokeh.mount()``.

All of them are built on a common :ref:`value serialization
<contributor_guide_protocol_values>` scheme.

This page describes the protocol for contributors and authors of language
bindings. A machine readable description is available as a `JSON schema`_
(draft 2020-12). It's published with each version of this documentation (its
``$id`` is the URL of that version's copy), and its source is
:bokeh-tree:`src/bokeh/_schemas/protocol.json`. The reference implementations
are :bokeh-tree:`src/bokeh/core/serialization.py` and
:bokeh-tree:`bokehjs/src/lib/core/serialization`.

.. _JSON schema: ../../schemas/protocol.json

.. _contributor_guide_protocol_values:

Values
------

Any value of a model's property, an event, or a message's content is serialized
using the following rules.

JSON values
~~~~~~~~~~~

``null``, booleans, strings, finite numbers and arrays are represented by
themselves. Python lists and tuples are serialized as JSON arrays. Integers
outside of JavaScript's safe range (±2\ :sup:`53`) are serialized as floats
(with a warning). Python ``datetime`` values and similar are converted to
floating point milliseconds since epoch, and ``date`` values to ISO strings.

JSON objects are never used to represent plain data. A JSON object is always
a *representation* of some value, identified by its keys (``$type``, ``$ref``,
``$value``, ``$field``, ``$expr``, ``id``) or by its ``type`` field.
Dictionaries are serialized as ``map`` representations (see below).

Representations
~~~~~~~~~~~~~~~

The following representations are identified by their ``type`` field:

``number``
    Non-finite floating point numbers, which JSON can't represent:

    .. code-block:: json

        {"type": "number", "value": "nan"}

    ``value`` is one of ``"nan"``, ``"-inf"`` or ``"+inf"``.

``array``
    An explicit array. Rarely used, as plain JSON arrays are preferred.
    ``entries`` is omitted if the array is empty:

    .. code-block:: json

        {"type": "array", "entries": [1, 2, 3]}

``set``
    A set (``set`` in Python, ``Set`` in JavaScript). ``entries`` is omitted
    if the set is empty. Sets of strings are sorted:

    .. code-block:: json

        {"type": "set", "entries": ["a", "b"]}

``map``
    A dictionary (``dict`` in Python, a plain object or ``Map`` in JavaScript).
    ``entries`` is a list of ``[key, value]`` pairs and is omitted if the
    dictionary is empty. Keys can be arbitrary values. BokehJS decodes a map
    with only string keys as a plain object, otherwise as a ``Map``:

    .. code-block:: json

        {"type": "map", "entries": [["x", 1], [0, "zero"]]}

``bytes``
    Binary data. ``data`` is either a reference to a buffer sent alongside the
    message (see :ref:`contributor_guide_protocol_buffers`), or inline base64
    encoded data. Inline data is always gzip compressed before base64 encoding:

    .. code-block:: javascript

        {"type": "bytes", "data": {"id": "p1047"}}
        {"type": "bytes", "data": "H4sIAAAAAAAA/6uoBACZKOaPAgAAAA=="}

``typed_array``
    A one dimensional numeric array (``array.array`` in Python, typed arrays
    in JavaScript). ``dtype`` is one of ``uint8``, ``int8``, ``uint16``,
    ``int16``, ``uint32``, ``int32``, ``float32`` or ``float64`` (64-bit
    integers aren't supported). ``order`` is the byte order of the sender
    (``"little"`` or ``"big"``), and the receiver swaps bytes if it differs:

    .. code-block:: json

        {
          "type": "typed_array",
          "array": {"type": "bytes", "data": {"id": "p1047"}},
          "order": "little",
          "dtype": "float64"
        }

``ndarray``
    An N-dimensional array (NumPy arrays, pandas series, and anything else
    convertible to a NumPy array). In addition to the data types of
    ``typed_array``, ``dtype`` can be ``bool`` or ``object``. Numeric and
    boolean arrays carry ``bytes`` data. Arrays of ``object`` dtype (including
    string arrays) carry a JSON array of values instead. Masked string entries
    are serialized as ``null``. 64-bit integer arrays are converted to 32-bit
    integers if their values allow. Arrays of any other data type are
    serialized with ``object`` dtype:

    .. code-block:: json

        {
          "type": "ndarray",
          "array": {"type": "bytes", "data": {"id": "p1047"}},
          "shape": [2, 3],
          "dtype": "int32",
          "order": "little"
        }

``slice``
    A slice, used e.g. in ``ColumnsPatched`` events. Missing bounds are
    ``null``:

    .. code-block:: json

        {"type": "slice", "start": 1, "stop": null, "step": null}

``date``
    A JavaScript ``Date``. Only produced by BokehJS. Python can't decode it:

    .. code-block:: json

        {"type": "date", "iso": "2026-11-16T12:00:00.000Z"}

``value``, ``field``, ``expr``
    The full form of data specification values (see
    :ref:`contributor_guide_protocol_dataspecs`).

``event``
    A UI event (see :ref:`contributor_guide_protocol_patches`).

``symbol``
    A named symbol. Reserved: neither side can decode it yet.

``ref``
    A legacy model reference, ``{"type": "ref", "id": "p1001"}``. Still
    accepted by decoders, but not produced anymore.

Models
~~~~~~

A model (an instance of a ``Model`` subclass) is serialized as an object with
its qualified type name under ``$type``, its ID under ``$id``, and its
properties' values as the remaining keys:

.. code-block:: json

    {
      "$type": "Range1d",
      "$id": "p1046",
      "start": 0,
      "end": 10
    }

Only properties whose values differ from defaults are included. An object
without ``$id`` creates a new anonymous model. Python dataclasses use the same
representation without ``$id``, with ``$type`` set to their fully qualified
Python name.

A model is fully serialized only once in a payload. Any later occurrence of
the same model in the same payload is a back-reference to its ID:

.. code-block:: json

    {"$ref": "p1046"}

A reference to a model that the receiver already knows, e.g. in a document
patch, uses a plain ``Ref``:

.. code-block:: json

    {"id": "p1046"}

The same ``{"id": ...}`` form is also used to reference model types in model
definitions, and binary buffers in ``bytes`` representations.

Model IDs
~~~~~~~~~

Live documents and patches always include ``$id`` for every model, because
both sides need to be able to address any model later. Static documents
(created with ``Document.to_static_json()``, used for standalone embedding)
are *graph-minimal*. They include ``$id`` only for models that are referenced
more than once or are part of a cycle, plus any model explicitly requested
by the caller. A model with a retained ID that is a property's default value
is included in the serialized model too, so that its identity is preserved.
IDs in static documents are reconstruction details and not stable addresses.

.. _contributor_guide_protocol_dataspecs:

Data specifications
~~~~~~~~~~~~~~~~~~~

Vectorized properties (e.g. glyphs' coordinates and visual properties) take
values, fields of a data source, or expressions, optionally with a transform
and units. Live documents and patches use the full form:

.. code-block:: javascript

    {"type": "field", "field": "x"}
    {"type": "value", "value": 10, "units": "screen"}
    {"type": "expr", "expr": {"$type": "Stack", "$id": "p1050", "fields": ["a", "b"]}}

Static documents use the compact form:

.. code-block:: javascript

    {"$field": "x"}
    {"$value": 10, "units": "screen"}
    {"$expr": {"$type": "Stack", "fields": ["a", "b"]}}

In the compact form, a value without a transform and units is serialized as
the bare value, e.g. ``10``, unless it's a string. String values are always
wrapped (``{"$value": "red"}``), because a bare string means a field name.

.. _contributor_guide_protocol_documents:

Documents
---------

A document (``DocJson``) is an object with the following fields:

``version``
    The version of Bokeh that produced the document. BokehJS warns if it
    doesn't match its own version.

``title``
    The document's title.

``config``
    The document's ``DocumentConfig`` model.

``roots``
    The list of the document's root models. This is the only required field.

``defs``
    Definitions of data models (see below). Present only if needed.

``callbacks``
    A ``map`` from document event names to lists of callback models (e.g.
    ``CustomJS``). Present only if needed.

For example:

.. code-block:: json

    {
      "version": "4.0.0",
      "title": "Bokeh Application",
      "config": {"$type": "DocumentConfig", "$id": "p1003", "notifications": {"$type": "Notifications", "$id": "p1004"}},
      "roots": [{"$type": "Div", "$id": "p1001", "text": "Hello"}],
      "callbacks": {
        "type": "map",
        "entries": [["document_ready", [{"$type": "CustomJS", "$id": "p1002", "code": "console.log('ready')"}]]]
      }
    }

Model definitions
~~~~~~~~~~~~~~~~~

Subclasses of ``DataModel`` don't have a BokehJS implementation. Instead,
they are defined in BokehJS at runtime from their definitions in ``defs``.
Definitions are ordered so that a base model and the models referenced by a
definition's properties are defined first:

.. code-block:: json

    {
      "type": "model",
      "name": "Q",
      "extends": {"id": "P"},
      "properties": [
        {"name": "c", "kind": ["List", ["Ref", {"id": "P"}]], "default": []}
      ],
      "overrides": [
        {"name": "a", "default": 2}
      ]
    }

``extends`` references the base data model, and is omitted for models
directly derived from ``Model``. ``default`` values are serialized values.
``properties`` define new properties, and ``overrides`` change defaults of
inherited properties.

``kind`` describes a property's type. It is either one of the primitive kinds
``"Any"``, ``"Unknown"``, ``"Bool"``, ``"Float"``, ``"Int"``, ``"Bytes"``,
``"Str"`` and ``"Null"``, or a tagged array:

* ``["Regex", pattern]``
* ``["Nullable", kind]``
* ``["Or", kind, ...]``
* ``["Tuple", kind, ...]``
* ``["List", kind]``
* ``["Struct", [name, kind], ...]``
* ``["Dict", value_kind]`` (dictionaries with string keys)
* ``["Mapping", key_kind, value_kind]``
* ``["Enum", value, ...]`` (string values)
* ``["Ref", {"id": model}]``
* ``["AnyRef"]``

Python property types without an exact equivalent are mapped to ``"Any"``.

.. _contributor_guide_protocol_messages:

Messages
--------

A Bokeh server and its clients exchange messages over a WebSocket connection,
established at the application's ``/ws`` endpoint. The client requests the
``bokeh`` subprotocol, followed by the session token, as the two values of
the ``Sec-WebSocket-Protocol`` header.

Envelope
~~~~~~~~

A message is sent as one text frame with a JSON envelope:

.. code-block:: json

    {
      "header": {"msgid": "p1048", "msgtype": "PATCH-DOC"},
      "content": {
        "events": [{
          "kind": "ModelChanged",
          "model": {"id": "p1007"},
          "attr": "x",
          "new": {"type": "ndarray", "array": {"type": "bytes", "data": {"id": "p1047"}}, "shape": [3], "dtype": "float64", "order": "little"}
        }]
      },
      "buffers": ["p1047"]
    }

``header.msgid``
    A unique, non-empty message ID.

``header.msgtype``
    The type of the message (see below).

``header.reqid``
    The ``msgid`` of the request that this message replies to. Present only
    in replies.

``content``
    The message's content, an object specific to the message type.

``buffers``
    The IDs of binary buffers that follow the envelope. At most 10000 unique
    IDs.

Envelopes, headers and buffer lists with unknown fields, missing fields, or
duplicate buffer IDs are rejected as protocol errors, which close the
connection.

.. _contributor_guide_protocol_buffers:

Buffers
~~~~~~~

The envelope is followed by one binary frame per entry in ``buffers``, in the
same order. A frame contains a buffer's raw (uncompressed) bytes. ``bytes``
representations in the content reference a buffer by its ID, e.g.
``{"type": "bytes", "data": {"id": "p1047"}}``. A message is complete when all
of its buffers have been received.

Message types
~~~~~~~~~~~~~

.. list-table::
    :header-rows: 1
    :widths: 20 15 30 35

    * - Type
      - Direction
      - Content
      - Purpose
    * - ``ACK``
      - server → client
      - ``{}``
      - Sent once when a connection is opened. The client waits for it before
        sending anything.
    * - ``PULL-DOC-REQ``
      - client → server
      - ``{}``
      - Request the session's document.
    * - ``PULL-DOC-REPLY``
      - server → client
      - ``{"doc": DocJson}``
      - Reply to ``PULL-DOC-REQ`` with the full document.
    * - ``PUSH-DOC``
      - client → server
      - ``{"doc": DocJson}``
      - Replace the session's document (used by ``bokeh.client``).
    * - ``PATCH-DOC``
      - both
      - ``{"events": [...]}``
      - Apply incremental changes to the document.
    * - ``SYNC``
      - client → server
      - ``{}``
      - A no-op request, used to wait for the processing of preceding messages.
    * - ``OK``
      - server → client
      - ``{}``
      - Successful reply to ``PUSH-DOC``, ``PATCH-DOC`` or ``SYNC``.
    * - ``ERROR``
      - server → client
      - ``{"text": str, "traceback": str | null}``
      - Failed reply to any request.

Replies (``PULL-DOC-REPLY``, ``OK`` and ``ERROR``) carry ``reqid``.

A typical session starts as follows:

1. The client opens a WebSocket connection and the server sends ``ACK``.
2. The client sends ``PULL-DOC-REQ`` and the server replies with
   ``PULL-DOC-REPLY``.
3. Both sides send ``PATCH-DOC`` whenever their copy of the document changes.

.. _contributor_guide_protocol_patches:

Document patches
~~~~~~~~~~~~~~~~

The content of ``PATCH-DOC`` is a non-empty list of events, applied in order.
Models known to the receiver are referenced with ``{"id": ...}``. New models
are fully serialized, with their IDs:

``ModelChanged``
    A property of a model was changed. ``callback_policy`` is optional and
    is one of ``["immediate", null]``, ``["committed", null]``,
    ``["throttle", ms]`` or ``["debounce", ms]``:

    .. code-block:: json

        {"kind": "ModelChanged", "model": {"id": "p1007"}, "attr": "x_range", "new": {"$type": "Range1d", "$id": "p1046", "end": 10}}

``ColumnDataChanged``
    Columns of a data source were replaced. ``cols`` lists the changed
    columns:

    .. code-block:: json

        {"kind": "ColumnDataChanged", "model": {"id": "p1006"}, "attr": "data", "data": {"type": "map", "entries": [["x", [1, 2]]]}, "cols": ["x"]}

``ColumnsStreamed``
    Data was appended to a data source. ``rollover`` limits the length of the
    columns:

    .. code-block:: json

        {"kind": "ColumnsStreamed", "model": {"id": "p1006"}, "attr": "data", "data": {"type": "map", "entries": [["x", [3]]]}, "rollover": 10}

``ColumnsPatched``
    Parts of columns of a data source were replaced. ``patches`` maps column
    names to lists of ``[index, value]`` pairs, where an index is an integer,
    a ``slice``, or (for multi-dimensional arrays) an array of integers and
    slices:

    .. code-block:: json

        {"kind": "ColumnsPatched", "model": {"id": "p1006"}, "attr": "data", "patches": {"type": "map", "entries": [["x", [[0, 5]]]]}}

``RootAdded``, ``RootRemoved``
    A root was added to or removed from the document. ``RootAdded`` carries
    the full model if it's new to the receiver:

    .. code-block:: javascript

        {"kind": "RootAdded", "model": {"$type": "Div", "$id": "p1050", "text": "New"}}
        {"kind": "RootRemoved", "model": {"id": "p1001"}}

``TitleChanged``
    The document's title was changed:

    .. code-block:: json

        {"kind": "TitleChanged", "title": "New title"}

``MessageSent``
    A message not tied to a model's state. UI events (see :ref:`bokeh.events`)
    are sent from BokehJS this way, with ``msg_type`` set to
    ``"bokeh_event"``:

    .. code-block:: json

        {
          "kind": "MessageSent",
          "msg_type": "bokeh_event",
          "msg_data": {"type": "event", "name": "tap", "values": {"type": "map", "entries": [["model", {"id": "p1007"}], ["x", 1.5]]}}
        }

.. _contributor_guide_protocol_embed:

Embed payloads
--------------

Bokeh's embedding API (see :ref:`ug_output_embed`) produces versioned embed
payloads, identified by the ``bokeh.embed/v1`` schema tag and the
``application/vnd.bokeh.embed+json`` MIME type. BokehJS accepts them in
``Bokeh.mount()``. A payload is plain JSON, without non-finite numbers:

.. code-block:: json

    {
      "schema": "bokeh.embed/v1",
      "bokeh_version": "4.0.0",
      "source": {"kind": "standalone", "documents": [{"roots": [{"$type": "Div", "text": "Hello"}]}]},
      "roots": [{"key": "root", "document": 0, "root": 0}],
      "requires": {"components": ["bokeh/core"], "extensions": []},
      "metadata": {"embedding": {"callback_policy": "warn", "input_shape": "model", "model_ids": "graph-minimal"}}
    }

``source``
    Either a standalone source, ``{"kind": "standalone", "documents": [doc]}``,
    with exactly one document (graph-minimal or protocol-full), or a server
    source:

    .. code-block:: json

        {
          "kind": "server",
          "url": "https://example.com/app",
          "session_id": "...",
          "arguments": {"name": "value"},
          "headers": {"Name": "value"},
          "credentials": "same-origin",
          "relative_urls": false
        }

    ``url`` is an HTTP(S) or relative URL, without a query or a fragment.
    Only one of ``session_id`` and ``token`` is allowed. ``credentials`` is
    one of ``"omit"``, ``"same-origin"`` or ``"include"``.

``roots``
    Logical root addresses. Each root has a unique, non-empty ``key``.
    Standalone roots address a document's root by its ordinals,
    ``{"key": ..., "document": 0, "root": n}``. Server roots address a root
    by its model ID, ``{"key": ..., "model_id": ...}``.

``requires``
    The runtime components (a unique subset of ``bokeh/core``,
    ``bokeh/widgets``, ``bokeh/tables``, ``bokeh/webgl``, ``bokeh/mathjax``
    and ``bokeh/api``), and extensions with unique names that the payload
    needs:

    .. code-block:: json

        {
          "components": ["bokeh/core", "bokeh/widgets"],
          "extensions": [
            {"name": "my_ext", "assets": [{"kind": "script", "url": "https://example.com/my_ext.js", "integrity": "sha384-..."}]}
          ]
        }

    An asset is a ``script`` or ``style`` located by exactly one of ``url``,
    ``content`` or ``package``, with optional ``integrity``, ``crossorigin``
    and ``module`` (scripts only) fields. Packaged assets must be scripts.
    Nonces are supplied by the host and are not allowed in payloads.

``metadata``
    Arbitrary host metadata. The ``embedding`` key is reserved for Bokeh.

Payloads don't have a ``buffers`` field. Standalone documents use inline
base64 encoded data, and server sources use protocol message buffers.

Server bootstrap
~~~~~~~~~~~~~~~~

Before opening a WebSocket connection for a server source, BokehJS requests
``<url>/embed.json``. It sends the payload's ``arguments`` as query parameters,
``headers`` as request headers, and ``session_id`` or ``token`` as
``Bokeh-Session-Id`` or ``Bokeh-Token`` headers. The server replies with a
``bokeh.embed-server/v1`` bootstrap that carries a session token and the
resources resolved for the session:

.. code-block:: json

    {
      "schema": "bokeh.embed-server/v1",
      "bokeh_version": "4.0.0",
      "token": "...",
      "requires": {"components": ["bokeh/core"], "extensions": []},
      "resources": {
        "mode": "resolved",
        "root_url": "/",
        "assets": [{"kind": "script", "url": "/static/js/bokeh.min.js"}]
      }
    }

A resolved asset is a ``script`` or ``style`` located by exactly one of
``url`` or ``content``, with optional ``content_sha256`` (inline content
only), ``integrity``, ``crossorigin``, ``nonce`` and ``module`` fields.
