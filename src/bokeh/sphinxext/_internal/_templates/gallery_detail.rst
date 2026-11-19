:orphan:

.. index::
   single: examples; {{ filename }}

.. The orphan/index prefix above identifies generated pages during stale-page
   cleanup. Keep it in sync with bokeh_gallery.config_inited_handler.

{{ ref }}

{{ title }}
{{ '=' * title|length }}

.. bokeh-plot:: {{ source_path }}
    :process-docstring:
    :source-position: below
