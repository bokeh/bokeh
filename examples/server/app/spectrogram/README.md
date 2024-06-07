# Spectrogram Example

Create an example that uses efficient Bokeh streaming to show an updating
waterfall spectrogram of live audio data.

<img src="https://static.bokeh.org/spectrogram.png" width="80%"></img>

## Setting Up

This demo requires the [SciPy](https://www.scipy.org) package in order to run.
To install SciPy using conda, execute the command:

    conda install scipy

To install using pip, execute the command:

    pip install scipy

Optionally, in order to use live audio data from a microphone, the pyaudio
package must also be installed. To install pyaudio using conda, execute the
command:

    conda install pyaudio

If pyaudio is not installed, this example will use simulated audio data.

## Running

To view the app directly from a Bokeh server, navigate to the parent directory
[`examples/server/app`](https://github.com/bokeh/bokeh/blob/-/examples/server/app),
and execute the command:

    bokeh serve --show spectrogram
