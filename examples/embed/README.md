This directory contains examples that demonstrate how to embed Bokeh plots and widgets as 
DOM elements of larger documents. Typically, this is accomplished using the [`bokeh.embed`](http://bokeh.pydata.org/en/latest/docs/user_guide/embed.html) interface. 

Specific instructions for each demo are below:

#### animated.py

To view this example, first start a Bokeh server:

    bokeh serve --allow-websocket-origin=localhost:8000

The option for websocket origin is to allow specific cross
domain connections.

Next load the example into the Bokeh server by
running the script:

    python animated.py

in this directory. Finally, start a simple web server
by running:

    python -m SimpleHTTPServer  (python 2)

or

    python -m http.server  (python 3)

in this directory. Navigate to

    http://localhost:8000/animated.html

#### embed_multiple.py

Execute the script:

    python embed_multiple.py

#### embed_multiple_responsive.py

Execute the script:

    python embed_multiple_responsive.py

#### embed_responsive_width_height.py

Execute the script:

    python embed_responsive_width_height.py

#### simple

See instructions in [simple/README.md](https://github.com/bokeh/bokeh/edit/master/examples/embed/simple/README.md)

#### spectrogram

See instructions in [spectrogram/README.md](https://github.com/bokeh/bokeh/edit/master/examples/embed/spectrogram/README.md)

#### widget.py

To view this example, first start a Bokeh server:

    bokeh serve --allow-websocket-origin=localhost:8000

The option for websocket origin is to allow specific cross
domain connections.

And then load the example into the Bokeh server by
running the script:

    python widget.py

in this directory. Finally, start a simple web server
by running:

    python -m SimpleHTTPServer  (python 2)

or

    python -m http.server  (python 3)

in this directory. Navigate to

    http://localhost:8000/widget.html











