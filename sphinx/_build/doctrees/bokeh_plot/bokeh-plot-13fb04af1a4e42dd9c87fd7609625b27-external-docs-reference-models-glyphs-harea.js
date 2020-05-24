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
    
      
      
    
      var element = document.getElementById("18d756be-5a5f-44ab-9dd7-db23a387d8dc");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid '18d756be-5a5f-44ab-9dd7-db23a387d8dc' but no matching script tag was found.")
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
    
        const hashes = {"https://cdn.bokeh.org/bokeh/release/bokeh-2.0.2.min.js": "ufR9RFnRs6lniiaFvtJziE0YeidtAgBRH6ux2oUItHw5WTvE1zuk9uzhUU/FJXDp", "https://cdn.bokeh.org/bokeh/release/bokeh-widgets-2.0.2.min.js": "8QM/PGWBT+IssZuRcDcjzwIh1mkOmJSoNMmyYDZbCfXJg3Ap1lEvdVgFuSAwhb/J", "https://cdn.bokeh.org/bokeh/release/bokeh-tables-2.0.2.min.js": "Jm8cH3Rg0P6UeZhVY5cLy1WzKajUT9KImCY+76hEqrcJt59/d8GPvFHjCkYgnSIn", "https://cdn.bokeh.org/bokeh/release/bokeh-gl-2.0.2.min.js": "Ozhzj+SI7ywm74aOI/UajcWz+C0NjsPunEVyVIrxzYkB+jA+2tUw8x5xJCbVtK5I"};
    
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
    
      
      var js_urls = ["https://cdn.bokeh.org/bokeh/release/bokeh-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-widgets-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-tables-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-gl-2.0.2.min.js"];
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
                    
                  var docs_json = '{&quot;828c690e-4a1b-40a2-87c0-3097cf12e519&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;},&quot;id&quot;:&quot;2920&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;2922&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;2924&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;2914&quot;}},&quot;id&quot;:&quot;2912&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;2918&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;2914&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:null,&quot;dimension&quot;:1,&quot;ticker&quot;:{&quot;id&quot;:&quot;2916&quot;}},&quot;id&quot;:&quot;2917&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;2919&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;2927&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;2916&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;2906&quot;}},&quot;id&quot;:&quot;2911&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;2924&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:&quot;#f46d43&quot;,&quot;x1&quot;:{&quot;field&quot;:&quot;x1&quot;},&quot;x2&quot;:{&quot;field&quot;:&quot;x2&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;2909&quot;,&quot;type&quot;:&quot;HArea&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;2912&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;2915&quot;},{&quot;id&quot;:&quot;2917&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;2913&quot;}],&quot;min_border&quot;:0,&quot;plot_height&quot;:300,&quot;plot_width&quot;:300,&quot;renderers&quot;:[{&quot;id&quot;:&quot;2910&quot;}],&quot;title&quot;:null,&quot;toolbar&quot;:{&quot;id&quot;:&quot;2920&quot;},&quot;toolbar_location&quot;:null,&quot;x_range&quot;:{&quot;id&quot;:&quot;2919&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;2921&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;2918&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;2922&quot;}},&quot;id&quot;:&quot;2907&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;x1&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[30]},&quot;x2&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAGEAiEHNWxKMaQOr5c2unCh1AVr0CP6k0H0A0rY/o5JAgQJDo5JAEaSFAvhCBmLMiIkC/JWT/8b0iQJInjsW/OiNAORb/6hyZI0Cy8bZvCdkjQP25tVOF+iNAG2/7lpD9I0AMEYg5K+IjQM+fWztVqCNAZRt2nA5QI0DOg9dcV9kiQAnZf3wvRCJAFxtv+5aQIUD4SaXZjb4gQFbLRC4onB9AYtzMZ1N+HUAUx+JfnSMbQGqLhhYGjBhAZSm4i423FUAFoXe/M6YSQJTkiWPxrw5AajpAxbiZB0CWQxKkvQkAQAAAAAAAAPA/&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[30]},&quot;y&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAAMCw3NMIyz39v2G5pxGWe/q/EpZ7GmG597/Cck8jLPf0v3JPIyz3NPK/RljuaYTl7r+oEZZ7GmHpvwjLPY2w3OO/0AjLPY2w3L+UexphuafRv2C5pxGWe7q/oHsaYbmnsT9QWO5phOXOP2C5pxGWe9o/UCMs9zTC4j/waYTlnkboP5Cw3NMIy+0/mHsaYbmn8T/mnkZY7mn0PzbCck8jLPc/huWeRlju+T/UCMs9jbD8PyQs9zTCcv8/uqcRlnsaAUBiuacRlnsCQArLPY2w3ANAstzTCMs9BUBY7mmE5Z4GQAAAAAAAAAhA&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[30]}},&quot;selected&quot;:{&quot;id&quot;:&quot;2927&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;2928&quot;}},&quot;id&quot;:&quot;2906&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:null,&quot;ticker&quot;:{&quot;id&quot;:&quot;2914&quot;}},&quot;id&quot;:&quot;2915&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;2926&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;2916&quot;}},&quot;id&quot;:&quot;2913&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;2906&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;2909&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;2911&quot;}},&quot;id&quot;:&quot;2910&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;2921&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;2928&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;2926&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;}],&quot;root_ids&quot;:[&quot;2907&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"828c690e-4a1b-40a2-87c0-3097cf12e519","root_ids":["2907"],"roots":{"2907":"18d756be-5a5f-44ab-9dd7-db23a387d8dc"}}];
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