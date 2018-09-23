(function(root) {
  function embed_document(root) {
    {% block code_to_run %}
    {% endblock %}
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
        console.log("Bokeh: ERROR: Unable to run BokehJS code because BokehJS library is missing");
        clearInterval(timer);
      }
    }, 10, root)
  }
})(window);
