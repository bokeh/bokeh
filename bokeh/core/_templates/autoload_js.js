{#
Renders JavaScript code for "autoloading".

The code automatically and asynchronously loads BokehJS (if necessary) and
then replaces the AUTOLOAD_TAG ``<script>`` tag that
calls it with the rendered model.

:param elementid: the unique id for the script tag
:type elementid: str

:param websocket_url: path to use to open websocket, or null if we are not using a server
:type websocket_url: str

:param sessionid: The id of the Bokeh server session to get a document from
:type sessionid: str

:param docs_json: embedded JSON serialization of documents
:type docs_json: dict

:param bootstrap_js: JS to define window.bokeh_load
:type bootstrap_js: str

#}
(function(global) {

  {{ bootstrap_js }}

  var elt = document.getElementById("{{ elementid }}");
  if(elt==null) {
    console.log("Bokeh: ERROR: autoload.js configured with elementid '{{ elementid }}' but no matching script tag was found. ")
    return false;
  }

  {% if websocket_url -%}
  var websocket_url = "{{ websocket_url }}";
  {%- else %}
  var websocket_url = null;
  {%- endif %}

  // Docs will be set for the static case
  {%- if docs_json %}
  var docs_json = {{ docs_json }};
  {%- else %}
  var docs_json = {};
  {%- endif %}

  var render_items = [{ 'elementid' : "{{ elementid }}",
                        'sessionid' : "{{ sessionid }}" }];

  bokeh_load(function() {
    Bokeh.embed.embed_items(docs_json, render_items, websocket_url);
  });

}(this));
