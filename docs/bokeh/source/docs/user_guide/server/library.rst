.. _ug_server_library:

Bokeh server APIs
=================

It can be useful to embed the Bokeh Server in a larger Tornado application, or a
Jupyter notebook, and use the already existing Tornado ``IOloop``. Here is the
basis for integration of Bokeh in such a scenario:

.. code-block:: python

   from bokeh.server.server import Server

   server = Server(
       bokeh_applications,  # list of Bokeh applications
       io_loop=loop,        # Tornado IOLoop
       **server_kwargs      # port, num_procs, etc.
   )

   # start timers and services and immediately return
   server.start()

You can also create and control an ``IOLoop`` directly. This can be useful when
creating standalone "normal" Python scripts that serve Bokeh apps or embedding
a Bokeh application in a framework like Flask or Django without having to run a
separate Bokeh server process. You can find some examples of this technique in
the examples directory:

* :bokeh-tree:`examples/server/api/flask_embed.py`
* :bokeh-tree:`examples/server/api/notebook_embed.ipynb`
* :bokeh-tree:`examples/server/api/standalone_embed.py`
* :bokeh-tree:`examples/server/api/tornado_embed.py`

Also note that every command line argument for ``bokeh serve`` has a
corresponding keyword argument for ``Server``. For instance, using the
``--allow-websocket-origin`` command line argument is equivalent to passing
``allow_websocket_origin`` as a parameter.

.. _ug_server_bokeh_client:

Connecting with ``bokeh.client``
--------------------------------

You can directly interact with the Bokeh server via a client API, which you can
use to make modifications to Bokeh documents in existing sessions on a Bokeh
server.

.. figure:: /_images/bokeh_serve_client.svg
    :align: center
    :width: 65%

    Typically, web browsers connect to the Bokeh server, but you can make a
    connection from Python by using the ``bokeh.client`` module.

This can be useful, for example, to make user-specific customizations to a
Bokeh app that is embedded by another web framework, such as Flask or Django.
In the following example, a Flask endpoint embeds a "sliders" app already
running on the server but changes the plot title *before* passing the output
to the user.

.. code-block:: python

    from flask import Flask, render_template

    from bokeh.client import pull_session
    from bokeh.embed import server_session

    app = Flask(__name__)

    @app.route('/', methods=['GET'])
    def bkapp_page():

        with pull_session(url="http://localhost:5006/sliders") as session:

            # update or customize that session
            session.document.roots[0].children[1].title.text = "Special sliders for a specific user!"

            # generate a script to load the customized session
            script = server_session(session_id=session.id, url='http://localhost:5006/sliders')

            # use the script in the rendered page
            return render_template("embed.html", script=script, template="Flask")

    if __name__ == '__main__':
        app.run(port=8080)
