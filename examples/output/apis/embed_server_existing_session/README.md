This example demonstrates using ``embed_server()`` to customize a Bokeh app
session before embedding it in a web page. To run, first execute this
command to start the Bokeh server:

    bokeh serve --port 5100 --allow-websocket-origin localhost:8080 --allow-websocket-origin 127.0.0.1:8080 bokeh_app.py

Then, in another execute the following command to start the Flask app:

    python serve.py

Now, navigate your browser to localhost:8080
