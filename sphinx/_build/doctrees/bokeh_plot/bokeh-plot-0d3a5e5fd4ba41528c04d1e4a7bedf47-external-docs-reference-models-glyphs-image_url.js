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
    
      
      
    
      var element = document.getElementById("445a1b5b-daf1-4385-8072-c5479487fee9");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid '445a1b5b-daf1-4385-8072-c5479487fee9' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;aeae64d2-fd01-4c95-b53e-db68f0ff480a&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;3247&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;3254&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;3256&quot;}},&quot;id&quot;:&quot;3255&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:null,&quot;ticker&quot;:{&quot;id&quot;:&quot;3265&quot;}},&quot;id&quot;:&quot;3266&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;3247&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;3260&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;3262&quot;}},&quot;id&quot;:&quot;3261&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;3265&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;h&quot;:{&quot;units&quot;:&quot;data&quot;,&quot;value&quot;:20},&quot;url&quot;:{&quot;field&quot;:&quot;url&quot;},&quot;w&quot;:{&quot;units&quot;:&quot;data&quot;,&quot;value&quot;:20},&quot;x&quot;:{&quot;field&quot;:&quot;x2&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y2&quot;}},&quot;id&quot;:&quot;3257&quot;,&quot;type&quot;:&quot;ImageURL&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;3277&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;end&quot;:200,&quot;start&quot;:-100},&quot;id&quot;:&quot;3249&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{&quot;end&quot;:200,&quot;start&quot;:-100},&quot;id&quot;:&quot;3248&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;3247&quot;}},&quot;id&quot;:&quot;3262&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;},&quot;id&quot;:&quot;3270&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;anchor&quot;:&quot;center&quot;,&quot;h&quot;:{&quot;field&quot;:&quot;h1&quot;,&quot;units&quot;:&quot;data&quot;},&quot;url&quot;:{&quot;field&quot;:&quot;url&quot;},&quot;w&quot;:{&quot;field&quot;:&quot;w1&quot;,&quot;units&quot;:&quot;data&quot;},&quot;x&quot;:{&quot;field&quot;:&quot;x1&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y1&quot;}},&quot;id&quot;:&quot;3254&quot;,&quot;type&quot;:&quot;ImageURL&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;3247&quot;}},&quot;id&quot;:&quot;3256&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;3247&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;3257&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;3259&quot;}},&quot;id&quot;:&quot;3258&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;3267&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;3272&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;3271&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;3274&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;3263&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;3266&quot;},{&quot;id&quot;:&quot;3268&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;3264&quot;}],&quot;min_border&quot;:0,&quot;plot_height&quot;:300,&quot;plot_width&quot;:300,&quot;renderers&quot;:[{&quot;id&quot;:&quot;3255&quot;},{&quot;id&quot;:&quot;3258&quot;},{&quot;id&quot;:&quot;3261&quot;}],&quot;title&quot;:null,&quot;toolbar&quot;:{&quot;id&quot;:&quot;3270&quot;},&quot;toolbar_location&quot;:null,&quot;x_range&quot;:{&quot;id&quot;:&quot;3248&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;3271&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;3249&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;3269&quot;}},&quot;id&quot;:&quot;3250&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:null,&quot;dimension&quot;:1,&quot;ticker&quot;:{&quot;id&quot;:&quot;3267&quot;}},&quot;id&quot;:&quot;3268&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;3274&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;3265&quot;}},&quot;id&quot;:&quot;3263&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;3272&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;3267&quot;}},&quot;id&quot;:&quot;3264&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;h1&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAJEAAAAAAAAA0QAAAAAAAAD5AAAAAAAAAREAAAAAAAABJQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;url&quot;:[&quot;https://static.bokeh.org/logos/logo.png&quot;,&quot;https://static.bokeh.org/logos/logo.png&quot;,&quot;https://static.bokeh.org/logos/logo.png&quot;,&quot;https://static.bokeh.org/logos/logo.png&quot;,&quot;https://static.bokeh.org/logos/logo.png&quot;],&quot;w1&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAJEAAAAAAAAA0QAAAAAAAAD5AAAAAAAAAREAAAAAAAABJQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;x1&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAAAAAAAAAAMBCQAAAAAAAwFJAAAAAAAAgXEAAAAAAAMBiQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;x2&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAScAAAAAAAAAAAAAAAAAAAElAAAAAAAAAWUAAAAAAAMBiQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;y1&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAAAAAAAAAAMBCQAAAAAAAwFJAAAAAAAAgXEAAAAAAAMBiQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;y2&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAAAAAAAAAAABJQAAAAAAAAFlAAAAAAADAYkAAAAAAAABpQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]}},&quot;selected&quot;:{&quot;id&quot;:&quot;3276&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;3277&quot;}},&quot;id&quot;:&quot;3247&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;3276&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;3269&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;3247&quot;}},&quot;id&quot;:&quot;3259&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;anchor&quot;:&quot;bottom_right&quot;,&quot;url&quot;:{&quot;value&quot;:&quot;https://static.bokeh.org/logos/logo.png&quot;},&quot;x&quot;:{&quot;value&quot;:200},&quot;y&quot;:{&quot;value&quot;:-100}},&quot;id&quot;:&quot;3260&quot;,&quot;type&quot;:&quot;ImageURL&quot;}],&quot;root_ids&quot;:[&quot;3250&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"aeae64d2-fd01-4c95-b53e-db68f0ff480a","root_ids":["3250"],"roots":{"3250":"445a1b5b-daf1-4385-8072-c5479487fee9"}}];
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