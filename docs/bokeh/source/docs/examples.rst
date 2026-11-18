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
Entries link to an interactive example where available, or to the repository source.

.. raw:: html

    <form class="bk-example-filter" role="search" hidden>
      <div class="bk-example-controls">
        <div>
          <label for="bk-example-query">Search examples</label>
          <input type="search" id="bk-example-query" placeholder="Try HoverTool or bar chart">
        </div>
        <div>
          <label for="bk-example-topic">Topic</label>
          <select id="bk-example-topic"><option value="">All topics</option></select>
        </div>
        <div>
          <label for="bk-example-type">Example type</label>
          <select id="bk-example-type"><option value="">All types</option></select>
        </div>
        <button type="reset" class="btn btn-outline-secondary">Clear</button>
      </div>
      <p id="bk-example-count" role="status"></p>
    </form>

.. bokeh-searchable-examples::
