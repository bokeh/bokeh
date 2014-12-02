To see these example you first have to start the bokeh-server, ie.:

    bokeh-server --backend=memory

and then run the examples:

    python widget.py

or

    python animated.py

To see them, you can easily start a python-based webserver:

    python -m SimpleHTTPServer

or

    python -m http.server (if you are using python 3)

and use the links provided when you run the scripts.

For app_reveal.py, first run:

    python app_reveal.py

and then navigate to:

    http://127.0.0.1:5000/

Finally to run the spectogram example you need to have pyaudio installed
and just run:

    python spectogram.py
