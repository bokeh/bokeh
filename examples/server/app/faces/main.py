''' A face detection example that uses the `Haar Cascade`_ algorithm.
This example shows the capability of Bokeh streaming with an integrated
OpenCV package.

.. note::
    This example needs the OpenCV package to run.

.. _Haar Cascade: https://docs.opencv.org/3.4/db/d28/tutorial_cascade_classifier.html

'''
from datetime import datetime as dt

import cv2

from bokeh.io import curdoc
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure
from bokeh.sampledata.haar_cascade import frontalface_default_path

CAMERA_WIDTH, CAMERA_HEIGHT = (1280, 780)

# try an external camera device first, fall back to default camera
video_capture = cv2.VideoCapture(1)
if not video_capture.isOpened():
    video_capture = cv2.VideoCapture(0)
video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)

# train our cascade classifier
face_cascade = cv2.CascadeClassifier(str(frontalface_default_path))

img_plot = figure(width=CAMERA_WIDTH//2, height=CAMERA_HEIGHT//2,
                  x_range=(0, CAMERA_WIDTH), y_range=(0, CAMERA_HEIGHT),
                  x_axis_type=None, y_axis_type=None,
                  tools="", toolbar_location=None, name="image")

image_source = ColumnDataSource(dict(image=[]))
img_plot.image_rgba('image', x=0, y=0, dw=CAMERA_WIDTH, dh=CAMERA_HEIGHT,
                    source=image_source)

rect_source = ColumnDataSource(dict(x=[], y=[], w=[], h=[]))
img_plot.rect('x', 'y', width='w', height='h', source=rect_source,
              fill_color=None, line_color="#fffdd0", line_width=4)

ts_plot = figure(width=CAMERA_WIDTH//2, height=150,
                 tools="", toolbar_location=None, name="ts")
ts_plot.y_range.start = 0
ts_plot.y_range.min_interval = 2

step_source = ColumnDataSource(dict(t=[], n=[]))
ts_plot.step('t', 'n', source=step_source, line_color="#fffdd0")

t0 = dt.now()

empty_rects = dict(x=[], y=[], w=[], h=[])

def update():
    ret, frame = video_capture.read()

    if not ret: return

    faces_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(faces_frame,
                                          scaleFactor=1.1,
                                          minNeighbors=5,
                                          minSize=(30, 30))

    img_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGBA)
    img_frame = img_frame.view(dtype="uint32").reshape(frame.shape[:2])
    img_frame = img_frame[::-2, ::2] # lightly decimate and invert for plotting

    if len(faces) == 0:
        rect_source.data = empty_rects
    else:
        # the faces rects origin is top left so we need to fix up
        faces = [(x+w/2, CAMERA_HEIGHT-y-h/2, w, h) for x, y, w, h in faces]
        rect_source.data = dict(zip(('x', 'y', 'w', 'h'), zip(*faces)))

    image_source.data["image"] = [img_frame]

    step_source.stream({
        't': [(dt.now() - t0).total_seconds() * 1000],
        'n': [len(faces)],
    }, rollover=200)

curdoc().add_root(img_plot)
curdoc().add_root(ts_plot)
curdoc().add_periodic_callback(update, 100)
curdoc().title = "Face Detection"
