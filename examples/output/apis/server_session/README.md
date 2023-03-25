This example demonstrates usage of ``server_session`` to customize a Bokeh
app session before embedding in a web page. To run, first execute the this
command to start the Bokeh server:

    bokeh serve --port 5100 --allow-websocket-origin localhost:8080 --allow-websocket-origin 127.0.0.1:8080 bokeh_app.py

Then, in another execute the following command to start the Flask app:

    python serve.py

Now, navigate your browser to localhost:8080
