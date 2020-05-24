(function() {
  var fn = function() {
    
    (function(root) {
      function now() {
        return new Date();
      }
    
      var force = false;
    
      if (typeof root._bokeh_onload_callbacks === "undefined" || force === true) {
        root._bokeh_onload_callbacks = [];
        root._bokeh_is_loading = undefined;
      }
    
      
      
    
      var element = document.getElementById("c2fec4f3-6b18-4421-982c-519d9104e387");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid 'c2fec4f3-6b18-4421-982c-519d9104e387' but no matching script tag was found.")
        }
      
    
      function run_callbacks() {
        try {
          root._bokeh_onload_callbacks.forEach(function(callback) {
            if (callback != null)
              callback();
          });
        } finally {
          delete root._bokeh_onload_callbacks
        }
        console.debug("Bokeh: all callbacks have finished");
      }
    
      function load_libs(css_urls, js_urls, callback) {
        if (css_urls == null) css_urls = [];
        if (js_urls == null) js_urls = [];
    
        root._bokeh_onload_callbacks.push(callback);
        if (root._bokeh_is_loading > 0) {
          console.debug("Bokeh: BokehJS is being loaded, scheduling callback at", now());
          return null;
        }
        if (js_urls == null || js_urls.length === 0) {
          run_callbacks();
          return null;
        }
        console.debug("Bokeh: BokehJS not loaded, scheduling load and callback at", now());
        root._bokeh_is_loading = css_urls.length + js_urls.length;
    
        function on_load() {
          root._bokeh_is_loading--;
          if (root._bokeh_is_loading === 0) {
            console.debug("Bokeh: all BokehJS libraries/stylesheets loaded");
            run_callbacks()
          }
        }
    
        function on_error() {
          console.error("failed to load " + url);
        }
    
        for (var i = 0; i < css_urls.length; i++) {
          var url = css_urls[i];
          const element = document.createElement("link");
          element.onload = on_load;
          element.onerror = on_error;
          element.rel = "stylesheet";
          element.type = "text/css";
          element.href = url;
          console.debug("Bokeh: injecting link tag for BokehJS stylesheet: ", url);
          document.body.appendChild(element);
        }
    
        const hashes = {"https://cdn.bokeh.org/bokeh/release/bokeh-2.0.2.min.js": "ufR9RFnRs6lniiaFvtJziE0YeidtAgBRH6ux2oUItHw5WTvE1zuk9uzhUU/FJXDp", "https://cdn.bokeh.org/bokeh/release/bokeh-widgets-2.0.2.min.js": "8QM/PGWBT+IssZuRcDcjzwIh1mkOmJSoNMmyYDZbCfXJg3Ap1lEvdVgFuSAwhb/J", "https://cdn.bokeh.org/bokeh/release/bokeh-tables-2.0.2.min.js": "Jm8cH3Rg0P6UeZhVY5cLy1WzKajUT9KImCY+76hEqrcJt59/d8GPvFHjCkYgnSIn", "https://cdn.bokeh.org/bokeh/release/bokeh-gl-2.0.2.min.js": "Ozhzj+SI7ywm74aOI/UajcWz+C0NjsPunEVyVIrxzYkB+jA+2tUw8x5xJCbVtK5I", "https://cdn.bokeh.org/bokeh/release/bokeh-api-2.0.2.min.js": "Zat0VmMWmxj1LsoPt4eZNROXIBlbHawNk70+fMuyPdrkf4bxPfol5eSjkM+2+Aql"};
    
        for (var i = 0; i < js_urls.length; i++) {
          var url = js_urls[i];
          var element = document.createElement('script');
          element.onload = on_load;
          element.onerror = on_error;
          element.async = false;
          element.src = url;
          if (url in hashes) {
            element.crossOrigin = "anonymous";
            element.integrity = "sha384-" + hashes[url];
          }
          console.debug("Bokeh: injecting script tag for BokehJS library: ", url);
          document.head.appendChild(element);
        }
      };
    
      function inject_raw_css(css) {
        const element = document.createElement("style");
        element.appendChild(document.createTextNode(css));
        document.body.appendChild(element);
      }
    
      
      var js_urls = ["https://cdn.bokeh.org/bokeh/release/bokeh-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-widgets-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-tables-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-gl-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-api-2.0.2.min.js"];
      var css_urls = [];
      
    
      var inline_js = [
        function(Bokeh) {
          Bokeh.set_log_level("info");
        },
        
        function(Bokeh) {
          (function() {
            var fn = function() {
              Bokeh.safely(function() {
                (function(root) {
                  function embed_document(root) {
                    
                  var docs_json = '{&quot;448bca62-327a-46f3-8c68-f70f03521612&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;data&quot;:{&quot;dates&quot;:[&quot;2014-03-01&quot;,&quot;2014-03-02&quot;,&quot;2014-03-03&quot;,&quot;2014-03-04&quot;,&quot;2014-03-05&quot;,&quot;2014-03-06&quot;,&quot;2014-03-07&quot;,&quot;2014-03-08&quot;,&quot;2014-03-09&quot;,&quot;2014-03-10&quot;],&quot;downloads&quot;:[73,81,15,99,70,50,100,68,98,85]},&quot;selected&quot;:{&quot;id&quot;:&quot;23302&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;23303&quot;}},&quot;id&quot;:&quot;23295&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;23305&quot;,&quot;type&quot;:&quot;StringEditor&quot;},{&quot;attributes&quot;:{&quot;editor&quot;:{&quot;id&quot;:&quot;23305&quot;},&quot;field&quot;:&quot;downloads&quot;,&quot;formatter&quot;:{&quot;id&quot;:&quot;23306&quot;},&quot;title&quot;:&quot;Downloads&quot;},&quot;id&quot;:&quot;23299&quot;,&quot;type&quot;:&quot;TableColumn&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;23306&quot;,&quot;type&quot;:&quot;StringFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;23304&quot;,&quot;type&quot;:&quot;StringEditor&quot;},{&quot;attributes&quot;:{&quot;columns&quot;:[{&quot;id&quot;:&quot;23297&quot;},{&quot;id&quot;:&quot;23299&quot;}],&quot;height&quot;:280,&quot;source&quot;:{&quot;id&quot;:&quot;23295&quot;},&quot;view&quot;:{&quot;id&quot;:&quot;23301&quot;},&quot;width&quot;:400},&quot;id&quot;:&quot;23300&quot;,&quot;type&quot;:&quot;DataTable&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;23302&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;23303&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;23296&quot;,&quot;type&quot;:&quot;DateFormatter&quot;},{&quot;attributes&quot;:{&quot;editor&quot;:{&quot;id&quot;:&quot;23304&quot;},&quot;field&quot;:&quot;dates&quot;,&quot;formatter&quot;:{&quot;id&quot;:&quot;23296&quot;},&quot;title&quot;:&quot;Date&quot;},&quot;id&quot;:&quot;23297&quot;,&quot;type&quot;:&quot;TableColumn&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;23295&quot;}},&quot;id&quot;:&quot;23301&quot;,&quot;type&quot;:&quot;CDSView&quot;}],&quot;root_ids&quot;:[&quot;23300&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"448bca62-327a-46f3-8c68-f70f03521612","root_ids":["23300"],"roots":{"23300":"c2fec4f3-6b18-4421-982c-519d9104e387"}}];
                  root.Bokeh.embed.embed_items(docs_json, render_items);
                
                  }
                  if (root.Bokeh !== undefined) {
                    embed_document(root);
                  } else {
                    var attempts = 0;
                    var timer = setInterval(function(root) {
                      if (root.Bokeh !== undefined) {
                        clearInterval(timer);
                        embed_document(root);
                      } else {
                        attempts++;
                        if (attempts > 100) {
                          clearInterval(timer);
                          console.log("Bokeh: ERROR: Unable to run BokehJS code because BokehJS library is missing");
                        }
                      }
                    }, 10, root)
                  }
                })(window);
              });
            };
            if (document.readyState != "loading") fn();
            else document.addEventListener("DOMContentLoaded", fn);
          })();
        },
        function(Bokeh) {
        
        
        }
      ];
    
      function run_inline_js() {
        
        for (var i = 0; i < inline_js.length; i++) {
          inline_js[i].call(root, root.Bokeh);
        }
        
      }
    
      if (root._bokeh_is_loading === 0) {
        console.debug("Bokeh: BokehJS loaded, going straight to plotting");
        run_inline_js();
      } else {
        load_libs(css_urls, js_urls, function() {
          console.debug("Bokeh: BokehJS plotting callback run at", now());
          run_inline_js();
        });
      }
    }(window));
  };
  if (document.readyState != "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
})();