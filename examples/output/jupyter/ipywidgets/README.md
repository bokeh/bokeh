Examples in this directory show off bokeh's capability to integrate with Jupyter widgets
outside of JupyterLab or classical Notebook environments. All examples are bokeh server
examples, so you run them with `bokeh server app_name`, and then you have to navigate
to `http://localhost:5006/app_name`:

* `ipyvolume_camera.py` -- shows how to integrate a third-party widget and manipulate it
with Bokeh's and IPyWidgets' controls.

* `ipyleaflet_tiles.py` -- IPyLeaflet and Bokeh's tile renderer side-by-side.
