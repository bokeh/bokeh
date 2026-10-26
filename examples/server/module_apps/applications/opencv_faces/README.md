# OpenCV faces

Detect faces with OpenCV and display video and detection counts.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.applications.opencv_faces.server:app
```

Open [the application](http://localhost:8000/).
`app.py` creates fresh models in `modify_document(doc)` for each session.
`server.py` supplies the ASGI host configuration.

Additional dependencies: opencv-python-headless<5 and bokeh_sampledata.

The default uses a generated frame and never opens the camera. Set
`BOKEH_EXAMPLE_CAMERA=1` before starting to enable live camera input.
The example tries device 1, then device 0. If neither opens, it displays the
generated frame once. The session closes its camera when it ends.
