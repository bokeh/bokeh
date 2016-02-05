.. _userguide_cli:

Using ``bokeh`` Commands
========================

It is possible to generate various kinds of output from Bokeh
programmatically. The use of ``output_file``, ``output_notebook``, etc.
has been demonstrated previously in many areas of the User Guide.
However, Bokeh also provides a command line tool ``bokeh`` that can
often offer a more flexible way to generate different kinds of output
from the same source code, as well as making it easier to and faster
to iterate.

There are three basic ``bokeh`` commands:

The ``bokeh html`` command can create standalone HTML documents from any
kind of Bokeh application source: e.g., python scripts, app directories,
JSON files, jupyter notebooks and others. For example:

.. code-block:: bash

    bokeh html myapp.py

The ``bokeh json`` command will generate a serialized JSON representation
of a Bokeh document from any kind of Bokeh application source. For example:

.. code-block:: bash

    bokeh json myapp.py


Finally, the ``bokeh serve`` command let's you instantly turn Bokeh documents
into interactive web applications. For example:

.. code-block:: bash

    bokeh serve myapp.py


In all of these cases, the same file ``myapp.py`` can be used without
modification to generate different sorts of output.

.. note::

    You can also run the bokeh command with Python by typing `python -m bokeh`

    For example, `bokeh serve myapp.py` can also be run with `python -m bokeh
    serve myapp.py`

.. _userguide_cli_html:

Standalone HTML
---------------

.. automodule:: bokeh.command.subcommands.html



.. _userguide_cli_json:

Serialized JSON
---------------

.. automodule:: bokeh.command.subcommands.json



.. _userguide_cli_serve:

Bokeh Server Applications
-------------------------

.. automodule:: bokeh.command.subcommands.serve
