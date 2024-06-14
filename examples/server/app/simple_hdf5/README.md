# Simple HDF5 Example

Create an app that can query and visualize
[HDF5](https://www.hdfgroup.org/solutions/hdf5/)
data files.

<img src="https://static.bokeh.org/simple_hdf5.png" width="80%"></img>

## Setting up

Before running this example, a sample data file must be generated. From the
command line, execute the following command:

    python create_hdf5.py

This demo requires the [h5py](https://www.h5py.org) library. From the command
line, execute the following command:

    conda install h5py

To install using pip, execute the command:

    pip install h5py

## Running

To view the app directly from a Bokeh server, navigate to the parent directory
[`examples/server/app`](https://github.com/bokeh/bokeh/blob/-/examples/server/app),
and execute the command:

    bokeh serve --show simple_hdf5
