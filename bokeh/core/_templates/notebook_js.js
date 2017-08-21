{% extends "doc_js.js" %}

{%- if comms_target -%}
  if ((Jupyter !== undefined) && Jupyter.notebook.kernel) {
    comm_manager = Jupyter.notebook.kernel.comm_manager
    comm_manager.register_target({{ comms_target|json }}, function () {});
  }
{%- endif -%}
