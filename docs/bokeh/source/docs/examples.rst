:notoc:

.. _example_index:

Examples index
==============

.. toctree::
    :hidden:
    :glob:
    :maxdepth: 1

    examples/**

Search the Python scripts and notebooks in Bokeh's examples directory.
Use **View example** to open a rendering where available. Every entry has a
**View source** link to the repository.

.. raw:: html

    <form class="bk-example-filter" role="search" hidden>
      <div class="bk-example-controls">
        <div>
          <label for="bk-example-query">Search examples</label>
          <input type="search" id="bk-example-query" class="form-control form-control-sm" placeholder="Try HoverTool or bar chart">
        </div>
        <div>
          <label for="bk-example-topic">Topic</label>
          <select id="bk-example-topic" class="form-select form-select-sm"><option value="">All topics</option></select>
        </div>
        <div>
          <label for="bk-example-type">Example type</label>
          <select id="bk-example-type" class="form-select form-select-sm"><option value="">All types</option></select>
        </div>
        <button type="reset" class="btn btn-sm btn-outline-secondary">Clear</button>
      </div>
      <p id="bk-example-count" role="status"></p>
    </form>

.. bokeh-searchable-examples::
