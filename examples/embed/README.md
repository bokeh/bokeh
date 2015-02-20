To try these example you first have to start the bokeh-server, ie.,

    bokeh-server --backend=memory

Some examples (e.g. publishing) need the server to run in multi-user mode:
    
    bokeh-server -m --backend=memory

Then run the examples:

    python widget.py

or

    python animated.py


To view them, start a web server in this directory, for instance, the server
built into python:

If you are using python 2, run:

    python -m SimpleHTTPServer

or if you are using python 3, run:

    python -m http.server

and use the links provided when you run the scripts.

For app_reveal.py, first run:

    python app_reveal.py

and then navigate to:

    http://127.0.0.1:5000/

Finally, the spectrogram example requires a working pyaudio library installed.
To view it, run:

    python spectogram.py

