# HDF5 distributions

Select probability distributions stored in an HDF5 file.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.applications.hdf5.main:app
```

Open [the application](http://localhost:8000/).
`main.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.

Additional dependencies: h5py and SciPy.

The example generates `demo_data.hdf5` beside the application on first use.
