# Face Detection Example

Create an example that uses [OpenCV](https://opencv.org) and efficient Bokeh
streaming to perform face detection on live video input.

<img src="https://static.bokeh.org/faces.png" width="80%"></img>

## Setting Up

This demo requires the [OpenCV](https://opencv.org) package in order to run. To
install OpenCV using conda, execute the command:

    conda install opencv

## Running

To view the app directly from a Bokeh server, navigate to the parent directory
[`examples/server/app`](https://github.com/bokeh/bokeh/blob/-/examples/server/app),
and execute the command:

    bokeh serve --show faces
