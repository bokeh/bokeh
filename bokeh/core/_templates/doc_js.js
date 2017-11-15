(function(root) {
  function embed_document(root) {
    var docs_json = {{ docs_json }};
    var render_items = {{ render_items }};
    root.Bokeh.embed.embed_items(docs_json, render_items{%- if app_path -%}, "{{ app_path }}" {%- endif -%}{%- if absolute_url -%}, "{{ absolute_url }}" {%- endif -%});
  }
  if (root.Bokeh !== undefined) {
    embed_document(root);
  } else {
    var attempts = 0;
    var timer = setInterval(function(root) {
      if (root.Bokeh !== undefined) {
        embed_document(root);
        clearInterval(timer);
      }
      attempts++;
      if (attempts > 100) {
        console.log("Bokeh: ERROR: Unable to embed document because BokehJS library is missing")
        clearInterval(timer);
      }
    }, 10, root)
  }
})(window);
