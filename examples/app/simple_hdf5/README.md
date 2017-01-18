Simple interactive query and visualization for HDF5 data files.

#### Setting up

Run the create_hdf5.py to create .hdf5 data file. From the command line, execute:

    python create_hdf5.py

This demo requires the h5py library. From the command line, execute:

    conda install h5py

To install using pip, execute the command:

    pip install h5py

#### Running

To view the app, navigate to the Bokeh_hdf5 directory and execute the command:

    bokeh serve --show main.py
