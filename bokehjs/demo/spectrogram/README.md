Audio Spectrogram Demo
======================

Build & Prereqs
===============

You will still need to follow the installation instructions in the top-level README.md in the bokehjs directory, i.e. you need to have node, npm, coffeescript, and grunt installed.

You will also need PyAudio and Flask installed (these come with Anaconda).

Note: In some debian-based systems, to install PyAudio, you will need some underlying dependencies, such as libjack-jackd2-dev and portaudio19-dev.

Build the coffeescript:

`$ grunt devdeploy`

or

`$ grunt deploy`

This should create spectrogram.js under the build/demo/spectrogram directory and copy all the supporting files there as well.

Running the Demo
================

Change to the spectrogram demo build directory (relative to the top-level bokehjs directory):

`$ cd build/demo/spectrogram`

Run the python server:

`$ python soundserver.py`

or

`$ python soundserver_threaded.py`

View the web page by visiting http://localhost:5000/. If you want to just see the raw JSON data dump, visit http://localhost:5000/data.  You can keep refreshing on the latter to see it update.

Helpful Demo Tips
=================

If you want to suppress all the chatty "HTTP/1.1 200" status codes, dump the output:

`$ python soundserver.py 2> /dev/null`

This is actually pretty useful because if your terminal program is set to use unlimited scrollback, and you leave the demo running a long time, you can actually chew through quite a bit of memory.

Bring the frequency slider max range down a bit (to maybe 1/5th of the full freq range) in order to see more angular coverage in the radial graphic equalizer.  Also, you can increase the gain to make the graphic equalizer more busy.

On Mac OSX, if you don't see much audio activity, you should go to System Preferences > Sound > Input and disable Ambient Noise Reduction.  You can also increase the microphone volume.

