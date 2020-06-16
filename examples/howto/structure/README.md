The examples in this directory illustrate the use of some tools that can assist in the
development of bokeh plots.  Currently this includes:

* a tool for constructing the directed graph of submodels of a bokeh model
and drawing that graph to illuminate the model structure. The
```BokehStructureGraph``` class provides three properties of a bokeh model:
    - a [networkx](https://networkx.github.io) DiGraph object whose nodes are the submodels of the model and
   edges run from submodels to their children.
   - a pandas dataframe of all the attributes of all the submodels, with their types (bokeh property), values,
   and docstrings.
   - a bokeh model that draws the graph of models and submodels; clicking on a node reveals the attributes
   of that submodel and their values.

    See [this jupyter notebook](./ModelStructureExample.ipynb)
    or run:

    ```
    $ python structure_graph.py
    ```
