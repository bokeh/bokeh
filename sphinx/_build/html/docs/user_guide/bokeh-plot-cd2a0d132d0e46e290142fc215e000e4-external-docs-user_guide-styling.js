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
    
      
      
    
      var element = document.getElementById("515439d2-a650-4312-b65e-af4d0cf8f0e9");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid '515439d2-a650-4312-b65e-af4d0cf8f0e9' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;80f049c8-b978-4b83-9864-61ace2b7eae7&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;31309&quot;},&quot;major_tick_out&quot;:10,&quot;minor_tick_in&quot;:-3,&quot;minor_tick_line_color&quot;:null,&quot;minor_tick_out&quot;:8,&quot;ticker&quot;:{&quot;id&quot;:&quot;31285&quot;}},&quot;id&quot;:&quot;31284&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:10},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;31304&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;31280&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;31283&quot;},{&quot;id&quot;:&quot;31287&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;31284&quot;}],&quot;plot_height&quot;:400,&quot;plot_width&quot;:400,&quot;renderers&quot;:[{&quot;id&quot;:&quot;31305&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;31307&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;31295&quot;},&quot;x_range&quot;:{&quot;id&quot;:&quot;31272&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;31276&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;31274&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;31278&quot;}},&quot;id&quot;:&quot;31271&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31289&quot;,&quot;type&quot;:&quot;WheelZoomTool&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;,&quot;tools&quot;:[{&quot;id&quot;:&quot;31288&quot;},{&quot;id&quot;:&quot;31289&quot;},{&quot;id&quot;:&quot;31290&quot;},{&quot;id&quot;:&quot;31291&quot;},{&quot;id&quot;:&quot;31292&quot;},{&quot;id&quot;:&quot;31293&quot;}]},&quot;id&quot;:&quot;31295&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;31280&quot;},&quot;ticker&quot;:null},&quot;id&quot;:&quot;31283&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;31284&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null},&quot;id&quot;:&quot;31287&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31272&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31292&quot;,&quot;type&quot;:&quot;ResetTool&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;31311&quot;},&quot;major_tick_line_color&quot;:&quot;firebrick&quot;,&quot;major_tick_line_width&quot;:3,&quot;major_tick_out&quot;:10,&quot;minor_tick_in&quot;:-3,&quot;minor_tick_line_color&quot;:&quot;orange&quot;,&quot;minor_tick_out&quot;:8,&quot;ticker&quot;:{&quot;id&quot;:&quot;31281&quot;}},&quot;id&quot;:&quot;31280&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;&quot;},&quot;id&quot;:&quot;31307&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31285&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31309&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;x&quot;:[1,2,3,4,5],&quot;y&quot;:[2,5,8,2,7]},&quot;selected&quot;:{&quot;id&quot;:&quot;31314&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;31315&quot;}},&quot;id&quot;:&quot;31302&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31315&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;31302&quot;}},&quot;id&quot;:&quot;31306&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31288&quot;,&quot;type&quot;:&quot;PanTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31281&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31274&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{&quot;overlay&quot;:{&quot;id&quot;:&quot;31294&quot;}},&quot;id&quot;:&quot;31290&quot;,&quot;type&quot;:&quot;BoxZoomTool&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;line_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:10},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;31303&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31293&quot;,&quot;type&quot;:&quot;HelpTool&quot;},{&quot;attributes&quot;:{&quot;bottom_units&quot;:&quot;screen&quot;,&quot;fill_alpha&quot;:0.5,&quot;fill_color&quot;:&quot;lightgrey&quot;,&quot;left_units&quot;:&quot;screen&quot;,&quot;level&quot;:&quot;overlay&quot;,&quot;line_alpha&quot;:1.0,&quot;line_color&quot;:&quot;black&quot;,&quot;line_dash&quot;:[4,4],&quot;line_width&quot;:2,&quot;right_units&quot;:&quot;screen&quot;,&quot;top_units&quot;:&quot;screen&quot;},&quot;id&quot;:&quot;31294&quot;,&quot;type&quot;:&quot;BoxAnnotation&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31311&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;31302&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;31303&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;31304&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;31306&quot;}},&quot;id&quot;:&quot;31305&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31291&quot;,&quot;type&quot;:&quot;SaveTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31278&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31276&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;31314&quot;,&quot;type&quot;:&quot;Selection&quot;}],&quot;root_ids&quot;:[&quot;31271&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"80f049c8-b978-4b83-9864-61ace2b7eae7","root_ids":["31271"],"roots":{"31271":"515439d2-a650-4312-b65e-af4d0cf8f0e9"}}];
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