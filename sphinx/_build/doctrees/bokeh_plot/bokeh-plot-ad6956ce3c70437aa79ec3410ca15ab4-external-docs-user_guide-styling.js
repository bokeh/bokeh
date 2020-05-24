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
    
      
      
    
      var element = document.getElementById("a4a5b5d5-11b4-4c9a-9e40-c9e98b1ab6ba");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid 'a4a5b5d5-11b4-4c9a-9e40-c9e98b1ab6ba' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;5a5d18a5-147d-4550-b1e5-8f86869ee344&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;overlay&quot;:{&quot;id&quot;:&quot;30777&quot;}},&quot;id&quot;:&quot;30773&quot;,&quot;type&quot;:&quot;LassoSelectTool&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;30763&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;30766&quot;},{&quot;id&quot;:&quot;30770&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;30767&quot;}],&quot;plot_height&quot;:400,&quot;plot_width&quot;:400,&quot;renderers&quot;:[{&quot;id&quot;:&quot;30786&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;30753&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;30778&quot;},&quot;x_range&quot;:{&quot;id&quot;:&quot;30755&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;30759&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;30757&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;30761&quot;}},&quot;id&quot;:&quot;30752&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:0.5,&quot;fill_color&quot;:&quot;lightgrey&quot;,&quot;level&quot;:&quot;overlay&quot;,&quot;line_alpha&quot;:1.0,&quot;line_color&quot;:&quot;black&quot;,&quot;line_dash&quot;:[10,10],&quot;line_width&quot;:2,&quot;xs_units&quot;:&quot;screen&quot;,&quot;ys_units&quot;:&quot;screen&quot;},&quot;id&quot;:&quot;30777&quot;,&quot;type&quot;:&quot;PolyAnnotation&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;30768&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;overlay&quot;:{&quot;id&quot;:&quot;30776&quot;}},&quot;id&quot;:&quot;30772&quot;,&quot;type&quot;:&quot;BoxZoomTool&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Select and Zoom&quot;},&quot;id&quot;:&quot;30753&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;30783&quot;}},&quot;id&quot;:&quot;30787&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;30759&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;30791&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;bottom_units&quot;:&quot;screen&quot;,&quot;fill_alpha&quot;:0.5,&quot;fill_color&quot;:&quot;firebrick&quot;,&quot;left_units&quot;:&quot;screen&quot;,&quot;level&quot;:&quot;overlay&quot;,&quot;line_alpha&quot;:1.0,&quot;line_color&quot;:null,&quot;line_dash&quot;:[4,4],&quot;line_width&quot;:2,&quot;right_units&quot;:&quot;screen&quot;,&quot;top_units&quot;:&quot;screen&quot;},&quot;id&quot;:&quot;30775&quot;,&quot;type&quot;:&quot;BoxAnnotation&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;,&quot;tools&quot;:[{&quot;id&quot;:&quot;30771&quot;},{&quot;id&quot;:&quot;30772&quot;},{&quot;id&quot;:&quot;30773&quot;},{&quot;id&quot;:&quot;30774&quot;}]},&quot;id&quot;:&quot;30778&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;30763&quot;},&quot;ticker&quot;:null},&quot;id&quot;:&quot;30766&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;30789&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;30768&quot;}},&quot;id&quot;:&quot;30767&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;30789&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;x&quot;:{&quot;__ndarray__&quot;:&quot;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&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[200]},&quot;y&quot;:{&quot;__ndarray__&quot;:&quot;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&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[200]}},&quot;selected&quot;:{&quot;id&quot;:&quot;30796&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;30797&quot;}},&quot;id&quot;:&quot;30783&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;30774&quot;,&quot;type&quot;:&quot;ResetTool&quot;},{&quot;attributes&quot;:{&quot;overlay&quot;:{&quot;id&quot;:&quot;30775&quot;}},&quot;id&quot;:&quot;30771&quot;,&quot;type&quot;:&quot;BoxSelectTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;30796&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:5},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;30785&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;30757&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;30761&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;30755&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{&quot;bottom_units&quot;:&quot;screen&quot;,&quot;fill_alpha&quot;:0.5,&quot;fill_color&quot;:null,&quot;left_units&quot;:&quot;screen&quot;,&quot;level&quot;:&quot;overlay&quot;,&quot;line_alpha&quot;:1.0,&quot;line_color&quot;:&quot;olive&quot;,&quot;line_dash&quot;:[],&quot;line_width&quot;:8,&quot;right_units&quot;:&quot;screen&quot;,&quot;top_units&quot;:&quot;screen&quot;},&quot;id&quot;:&quot;30776&quot;,&quot;type&quot;:&quot;BoxAnnotation&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;30764&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;line_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:5},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;30784&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;30797&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;30791&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;30764&quot;}},&quot;id&quot;:&quot;30763&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;30767&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null},&quot;id&quot;:&quot;30770&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;30783&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;30784&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;30785&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;30787&quot;}},&quot;id&quot;:&quot;30786&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;}],&quot;root_ids&quot;:[&quot;30752&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"5a5d18a5-147d-4550-b1e5-8f86869ee344","root_ids":["30752"],"roots":{"30752":"a4a5b5d5-11b4-4c9a-9e40-c9e98b1ab6ba"}}];
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