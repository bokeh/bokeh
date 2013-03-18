Audio Spectrogram Demo
======================

This demo can be built entirely outside of the regular BokehJS build process.

Build & Prereqs
===============

You will still need to follow the Coffeescript installation instructions in the top-level README, i.e. you need to have node, npm, coffeescript, and hem installed.

You will also need PyAudio and Flask installed.  (These come with Anaconda.)

Build the coffeescript:

`$ hem build`

This should create a `static/js/application.js` file.

Running the Demo
================

Run the server:

`$ python demoserver.py`

View the web page by visiting http://localhost:5000/.  If you want to just see the raw JSON data dump, visit http://localhost:5000/data.  You can keep refreshing on the latter.

Helpful Demo Tips
=================

If you want to suppress all the chatty "HTTP/1.1 200" status codes, dump the output:

`$ python demoserver.py 2> /dev/null`

This is actually pretty useful because if your terminal program is set to use unlimited scrollback, and you leave the demo running a long time, you can actually chew through quite a bit of memory.

Bring the frequency slider max range down a bit (to maybe 1/5th of the full freq range) in order to see more angular coverage in the radial graphic equalizer.  Also, you can increase the gain to make the graphic equalizer more busy.

On Mac OSX, if you don't see much audio activity, you should go to System Preferences > Sound > Input and disable Ambient Noise Reduction.  You can also increase the microphone volume.

