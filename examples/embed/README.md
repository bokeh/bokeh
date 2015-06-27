### Embed mutltiple

To run the example:

    python embed_multiple.py

---

### Widget, animated

To try these example you first have to start the bokeh-server, ie.,

    bokeh-server

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

---
### Publishing

Publishing needs the server to run in multi-user mode:
    
    bokeh-server --multi-user

Then run:

    python publishing.py

Open the file `publishing.html` in your browser - you will see it is animated.

---

### Bokeh plots in an online slideshow

    cd slideshow
    python app_reveal.py

and then navigate to:

    http://127.0.0.1:5000/

---

### Spectrogram

The spectrogram example requires the pyaudio library, which is available
via conda on py27. Or see the documentation here: https://people.csail.mit.edu/hubert/pyaudio/

    conda install -c mutirri pyaudio

To run the spectrogram example:

    python spectogram.py

Then open your webbrowser at: http://localhost:5000
