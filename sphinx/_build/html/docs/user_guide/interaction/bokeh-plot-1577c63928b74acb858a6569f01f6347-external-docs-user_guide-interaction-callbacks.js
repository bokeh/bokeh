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
    
      
      
    
      var element = document.getElementById("c2027f01-1139-4159-a21f-46d2d4168399");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid 'c2027f01-1139-4159-a21f-46d2d4168399' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;b9675a02-57fa-4437-8b70-e100f80bea18&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;22075&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;22076&quot;},&quot;hover_glyph&quot;:{&quot;id&quot;:&quot;22078&quot;},&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;22077&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;22080&quot;}},&quot;id&quot;:&quot;22079&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;22085&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;22065&quot;}},&quot;id&quot;:&quot;22064&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;22092&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;22052&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;22087&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;22061&quot;}},&quot;id&quot;:&quot;22060&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;22060&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;22063&quot;},{&quot;id&quot;:&quot;22067&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;22064&quot;}],&quot;plot_height&quot;:400,&quot;plot_width&quot;:400,&quot;renderers&quot;:[{&quot;id&quot;:&quot;22073&quot;},{&quot;id&quot;:&quot;22079&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;22050&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;22068&quot;},&quot;toolbar_location&quot;:null,&quot;x_range&quot;:{&quot;id&quot;:&quot;22052&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;22056&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;22054&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;22058&quot;}},&quot;id&quot;:&quot;22049&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;22085&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;22064&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null},&quot;id&quot;:&quot;22067&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;22091&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;line_alpha&quot;:{&quot;value&quot;:0.6},&quot;line_color&quot;:{&quot;value&quot;:&quot;olive&quot;},&quot;line_width&quot;:{&quot;value&quot;:3},&quot;x0&quot;:{&quot;field&quot;:&quot;x0&quot;},&quot;x1&quot;:{&quot;field&quot;:&quot;x1&quot;},&quot;y0&quot;:{&quot;field&quot;:&quot;y0&quot;},&quot;y1&quot;:{&quot;field&quot;:&quot;y1&quot;}},&quot;id&quot;:&quot;22071&quot;,&quot;type&quot;:&quot;Segment&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;,&quot;tools&quot;:[{&quot;id&quot;:&quot;22082&quot;}]},&quot;id&quot;:&quot;22068&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;x&quot;:[2,3,5,6,8,7],&quot;y&quot;:[6,4,3,8,7,5]},&quot;selected&quot;:{&quot;id&quot;:&quot;22091&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;22092&quot;}},&quot;id&quot;:&quot;22075&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;22075&quot;}},&quot;id&quot;:&quot;22080&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;x0&quot;:[],&quot;x1&quot;:[],&quot;y0&quot;:[],&quot;y1&quot;:[]},&quot;selected&quot;:{&quot;id&quot;:&quot;22089&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;22090&quot;}},&quot;id&quot;:&quot;22069&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;22090&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;22087&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.4},&quot;fill_color&quot;:{&quot;value&quot;:&quot;olive&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.4},&quot;line_color&quot;:{&quot;value&quot;:&quot;olive&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:30},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;22076&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Hover over points&quot;},&quot;id&quot;:&quot;22050&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{&quot;callback&quot;:{&quot;id&quot;:&quot;22081&quot;},&quot;renderers&quot;:[{&quot;id&quot;:&quot;22079&quot;}],&quot;tooltips&quot;:null},&quot;id&quot;:&quot;22082&quot;,&quot;type&quot;:&quot;HoverTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;22056&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;olive&quot;},&quot;line_color&quot;:{&quot;value&quot;:&quot;olive&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:30},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;22078&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{&quot;args&quot;:{&quot;circle&quot;:{&quot;id&quot;:&quot;22075&quot;},&quot;segment&quot;:{&quot;id&quot;:&quot;22069&quot;}},&quot;code&quot;:&quot;\\nconst links = {0: [1, 2], 1: [0, 3, 4], 2: [0, 5], 3: [1, 4], 4: [1, 3], 5: [2, 3, 4]}\\nconst data = {&#x27;x0&#x27;: [], &#x27;y0&#x27;: [], &#x27;x1&#x27;: [], &#x27;y1&#x27;: []}\\nconst indices = cb_data.index.indices\\nfor (var i = 0; i &lt; indices.length; i++) {\\n    const start = indices[i]\\n    for (var j = 0; j &lt; links[start].length; j++) {\\n        const end = links[start][j]\\n        data[&#x27;x0&#x27;].push(circle.data.x[start])\\n        data[&#x27;y0&#x27;].push(circle.data.y[start])\\n        data[&#x27;x1&#x27;].push(circle.data.x[end])\\n        data[&#x27;y1&#x27;].push(circle.data.y[end])\\n    }\\n}\\nsegment.data = data\\n&quot;},&quot;id&quot;:&quot;22081&quot;,&quot;type&quot;:&quot;CustomJS&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;22069&quot;}},&quot;id&quot;:&quot;22074&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;22065&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;22054&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;22061&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;22069&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;22071&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;22072&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;22074&quot;}},&quot;id&quot;:&quot;22073&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;olive&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;olive&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:30},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;22077&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;olive&quot;},&quot;line_width&quot;:{&quot;value&quot;:3},&quot;x0&quot;:{&quot;field&quot;:&quot;x0&quot;},&quot;x1&quot;:{&quot;field&quot;:&quot;x1&quot;},&quot;y0&quot;:{&quot;field&quot;:&quot;y0&quot;},&quot;y1&quot;:{&quot;field&quot;:&quot;y1&quot;}},&quot;id&quot;:&quot;22072&quot;,&quot;type&quot;:&quot;Segment&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;22089&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;22058&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;22060&quot;},&quot;ticker&quot;:null},&quot;id&quot;:&quot;22063&quot;,&quot;type&quot;:&quot;Grid&quot;}],&quot;root_ids&quot;:[&quot;22049&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"b9675a02-57fa-4437-8b70-e100f80bea18","root_ids":["22049"],"roots":{"22049":"c2027f01-1139-4159-a21f-46d2d4168399"}}];
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