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
    
      
      
    
      var element = document.getElementById("269d5da5-4faa-4ae0-a3d3-fde9d39fbbb5");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid '269d5da5-4faa-4ae0-a3d3-fde9d39fbbb5' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;390cd48a-2ea3-4db7-ad40-d7929a4b5aa5&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{},&quot;id&quot;:&quot;16927&quot;,&quot;type&quot;:&quot;CategoricalTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;16924&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;16930&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;16941&quot;,&quot;type&quot;:&quot;CategoricalTickFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;16945&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Fruit Counts&quot;},&quot;id&quot;:&quot;16916&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;16926&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;16928&quot;},{&quot;id&quot;:&quot;16932&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;16929&quot;}],&quot;plot_height&quot;:250,&quot;renderers&quot;:[{&quot;id&quot;:&quot;16937&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;16916&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;16933&quot;},&quot;toolbar_location&quot;:null,&quot;x_range&quot;:{&quot;id&quot;:&quot;16918&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;16922&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;16920&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;16924&quot;}},&quot;id&quot;:&quot;16915&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{&quot;factors&quot;:[&quot;Apples&quot;,&quot;Pears&quot;,&quot;Nectarines&quot;,&quot;Plums&quot;,&quot;Grapes&quot;,&quot;Strawberries&quot;]},&quot;id&quot;:&quot;16918&quot;,&quot;type&quot;:&quot;FactorRange&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;top&quot;:{&quot;field&quot;:&quot;top&quot;},&quot;width&quot;:{&quot;value&quot;:0.9},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;}},&quot;id&quot;:&quot;16936&quot;,&quot;type&quot;:&quot;VBar&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;16934&quot;}},&quot;id&quot;:&quot;16938&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;start&quot;:0},&quot;id&quot;:&quot;16920&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;16929&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null},&quot;id&quot;:&quot;16932&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;16944&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;top&quot;:[5,3,4,2,4,6],&quot;x&quot;:[&quot;Apples&quot;,&quot;Pears&quot;,&quot;Nectarines&quot;,&quot;Plums&quot;,&quot;Grapes&quot;,&quot;Strawberries&quot;]},&quot;selected&quot;:{&quot;id&quot;:&quot;16944&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;16945&quot;}},&quot;id&quot;:&quot;16934&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;16943&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;16943&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;16930&quot;}},&quot;id&quot;:&quot;16929&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;16934&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;16935&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;16936&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;16938&quot;}},&quot;id&quot;:&quot;16937&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;},&quot;id&quot;:&quot;16933&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;16941&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;16927&quot;}},&quot;id&quot;:&quot;16926&quot;,&quot;type&quot;:&quot;CategoricalAxis&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;line_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;top&quot;:{&quot;field&quot;:&quot;top&quot;},&quot;width&quot;:{&quot;value&quot;:0.9},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;}},&quot;id&quot;:&quot;16935&quot;,&quot;type&quot;:&quot;VBar&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;16922&quot;,&quot;type&quot;:&quot;CategoricalScale&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;16926&quot;},&quot;grid_line_color&quot;:null,&quot;ticker&quot;:null},&quot;id&quot;:&quot;16928&quot;,&quot;type&quot;:&quot;Grid&quot;}],&quot;root_ids&quot;:[&quot;16915&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"390cd48a-2ea3-4db7-ad40-d7929a4b5aa5","root_ids":["16915"],"roots":{"16915":"269d5da5-4faa-4ae0-a3d3-fde9d39fbbb5"}}];
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