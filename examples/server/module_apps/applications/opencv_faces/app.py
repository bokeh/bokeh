"""Detect faces with OpenCV and display video and detection counts."""

import os
from datetime import datetime as dt
from pathlib import Path

import cv2
import numpy as np
from jinja2 import Environment, FileSystemLoader

from bokeh.models import ColumnDataSource, Div
from bokeh.plotting import figure
from bokeh.sampledata.haar_cascade import frontalface_default_path
from bokeh.themes import Theme


def modify_document(doc):
    doc.theme = Theme(filename=Path(__file__).with_name("theme.yaml"))
    doc.template = Environment(loader=FileSystemLoader(Path(__file__).parent / "templates")).get_template("index.html")
    static_url = "static"
    if doc.session_context is not None and doc.session_context.request is not None:
        request = doc.session_context.request
        path = request.path.rstrip("/")
        mount = request.root_path.rstrip("/")
        if mount and path != mount and not path.startswith(mount + "/"):
            path = mount + path
        static_url = path + "/static"
    doc.template_variables["static_url"] = static_url
    CAMERA_WIDTH, CAMERA_HEIGHT = (1280, 780)
    video_capture = None
    if os.environ.get("BOKEH_EXAMPLE_CAMERA") == "1":
        video_capture = cv2.VideoCapture(1)
        if not video_capture.isOpened():
            video_capture.release()
            video_capture = cv2.VideoCapture(0)
        if not video_capture.isOpened():
            video_capture.release()
            video_capture = None
        if video_capture is not None:
            video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
            video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
            doc.on_session_destroyed(lambda context: video_capture.release())

    face_cascade = cv2.CascadeClassifier(str(frontalface_default_path))
    haar_feature = Div(
        text=r"$$f = \sum_{p \in R_+} I(p) - \sum_{p \in R_-} I(p).$$",
        styles={
            "background-color": "transparent",
            "color": "#f8f9fa",
            "font-size": "1.2rem",
            "text-align": "center",
        },
        sizing_mode="stretch_width",
        margin=0,
        name="haar_feature",
    )
    img_plot = figure(width=CAMERA_WIDTH//2, height=CAMERA_HEIGHT//2,
                      x_range=(0, CAMERA_WIDTH), y_range=(0, CAMERA_HEIGHT),
                      x_axis_type=None, y_axis_type=None,
                      tools="", toolbar_location=None, name="image")
    image_source = ColumnDataSource(dict(image=[], w=[], h=[]))
    img_plot.image_rgba('image', x=0, y=0, dw='w', dh='h',
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
        if video_capture is None:
            frame = np.zeros((CAMERA_HEIGHT, CAMERA_WIDTH, 3), dtype=np.uint8)
            cv2.putText(frame, "Set BOKEH_EXAMPLE_CAMERA=1 for live video", (40, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            ret = True
        else:
            ret, frame = video_capture.read()

        if not ret: return

        frame_height, frame_width = frame.shape[:2]
        img_plot.x_range.end = frame_width
        img_plot.y_range.end = frame_height
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
            faces = [(x+w/2, frame_height-y-h/2, w, h) for x, y, w, h in faces]
            rect_source.data = dict(zip(('x', 'y', 'w', 'h'), zip(*faces)))

        image_source.data = dict(image=[img_frame], w=[frame_width], h=[frame_height])
        step_source.stream({
            't': [(dt.now() - t0).total_seconds() * 1000],
            'n': [len(faces)],
        }, rollover=200)

    doc.add_root(haar_feature)
    doc.add_root(img_plot)
    doc.add_root(ts_plot)

    if video_capture is None:
        update()
    else:
        doc.add_periodic_callback(update, 100)

    doc.title = "Face Detection"
