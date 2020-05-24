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
    
      
      
    
      var element = document.getElementById("eb36c593-852b-4d2e-b991-14c783161bf9");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid 'eb36c593-852b-4d2e-b991-14c783161bf9' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;945f2249-5e56-428d-8c8a-343d6a1a864a&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20465&quot;,&quot;type&quot;:&quot;PanTool&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;,&quot;tools&quot;:[{&quot;id&quot;:&quot;20465&quot;},{&quot;id&quot;:&quot;20466&quot;},{&quot;id&quot;:&quot;20467&quot;},{&quot;id&quot;:&quot;20468&quot;}]},&quot;id&quot;:&quot;20469&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;dimension&quot;:&quot;lat&quot;},&quot;id&quot;:&quot;20460&quot;,&quot;type&quot;:&quot;MercatorTickFormatter&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;20460&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;20461&quot;}},&quot;id&quot;:&quot;20462&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;20474&quot;}},&quot;id&quot;:&quot;20479&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;20474&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;20476&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;20477&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;20479&quot;}},&quot;id&quot;:&quot;20478&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20450&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20451&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{&quot;dimension&quot;:&quot;lon&quot;},&quot;id&quot;:&quot;20455&quot;,&quot;type&quot;:&quot;MercatorTickFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20468&quot;,&quot;type&quot;:&quot;HelpTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20481&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20483&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20480&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20467&quot;,&quot;type&quot;:&quot;ResetTool&quot;},{&quot;attributes&quot;:{&quot;dimension&quot;:&quot;lon&quot;},&quot;id&quot;:&quot;20456&quot;,&quot;type&quot;:&quot;MercatorTicker&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Austin&quot;},&quot;id&quot;:&quot;20449&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{&quot;dimension&quot;:&quot;lat&quot;},&quot;id&quot;:&quot;20461&quot;,&quot;type&quot;:&quot;MercatorTicker&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;lat&quot;:[30.29,30.2,30.29],&quot;lon&quot;:[-97.7,-97.74,-97.78]},&quot;selected&quot;:{&quot;id&quot;:&quot;20483&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;20484&quot;}},&quot;id&quot;:&quot;20474&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20484&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;api_key&quot;:&quot;TUlTU0lOR19BUElfS0VZ&quot;,&quot;below&quot;:[{&quot;id&quot;:&quot;20457&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;20462&quot;}],&quot;map_options&quot;:{&quot;id&quot;:&quot;20447&quot;},&quot;renderers&quot;:[{&quot;id&quot;:&quot;20478&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;20449&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;20469&quot;},&quot;x_range&quot;:{&quot;id&quot;:&quot;20450&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;20480&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;20451&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;20481&quot;}},&quot;id&quot;:&quot;20448&quot;,&quot;subtype&quot;:&quot;GMap&quot;,&quot;type&quot;:&quot;GMapPlot&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;blue&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:15},&quot;x&quot;:{&quot;field&quot;:&quot;lon&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;lat&quot;}},&quot;id&quot;:&quot;20477&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;20455&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;20456&quot;}},&quot;id&quot;:&quot;20457&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;lat&quot;:30.2861,&quot;lng&quot;:-97.7394,&quot;zoom&quot;:11},&quot;id&quot;:&quot;20447&quot;,&quot;type&quot;:&quot;GMapOptions&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.8},&quot;fill_color&quot;:{&quot;value&quot;:&quot;blue&quot;},&quot;line_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:15},&quot;x&quot;:{&quot;field&quot;:&quot;lon&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;lat&quot;}},&quot;id&quot;:&quot;20476&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20466&quot;,&quot;type&quot;:&quot;WheelZoomTool&quot;}],&quot;root_ids&quot;:[&quot;20448&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"945f2249-5e56-428d-8c8a-343d6a1a864a","root_ids":["20448"],"roots":{"20448":"eb36c593-852b-4d2e-b991-14c783161bf9"}}];
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