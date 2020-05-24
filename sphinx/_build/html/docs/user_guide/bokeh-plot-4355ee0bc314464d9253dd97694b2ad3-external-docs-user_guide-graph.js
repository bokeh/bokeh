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
    
      
      
    
      var element = document.getElementById("e4f19926-7cd8-4df4-9c4d-1347bec7017d");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid 'e4f19926-7cd8-4df4-9c4d-1347bec7017d' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;036afc12-cb1b-48e6-9025-5026480cfd4c&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20653&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;end&quot;:1.1,&quot;start&quot;:-1.1},&quot;id&quot;:&quot;20602&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20654&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;20608&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;20611&quot;},{&quot;id&quot;:&quot;20615&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;20612&quot;}],&quot;renderers&quot;:[{&quot;id&quot;:&quot;20617&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;20598&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;20616&quot;},&quot;toolbar_location&quot;:null,&quot;x_range&quot;:{&quot;id&quot;:&quot;20600&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;20604&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;20602&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;20606&quot;}},&quot;id&quot;:&quot;20597&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20637&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;graph_layout&quot;:{&quot;0&quot;:[1.0,0.0],&quot;1&quot;:[0.7071067811865476,0.7071067811865476],&quot;2&quot;:[6.123233995736766e-17,1.0],&quot;3&quot;:[-0.7071067811865475,0.7071067811865476],&quot;4&quot;:[-1.0,1.2246467991473532e-16],&quot;5&quot;:[-0.7071067811865477,-0.7071067811865475],&quot;6&quot;:[-1.8369701987210297e-16,-1.0],&quot;7&quot;:[0.7071067811865474,-0.7071067811865477]}},&quot;id&quot;:&quot;20635&quot;,&quot;type&quot;:&quot;StaticLayoutProvider&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;color&quot;:[&quot;#3288bd&quot;,&quot;#66c2a5&quot;,&quot;#abdda4&quot;,&quot;#e6f598&quot;,&quot;#fee08b&quot;,&quot;#fdae61&quot;,&quot;#f46d43&quot;,&quot;#d53e4f&quot;],&quot;index&quot;:[0,1,2,3,4,5,6,7]},&quot;selected&quot;:{&quot;id&quot;:&quot;20653&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;20654&quot;}},&quot;id&quot;:&quot;20619&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;20619&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;20626&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;20621&quot;}},&quot;id&quot;:&quot;20620&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20609&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;20619&quot;}},&quot;id&quot;:&quot;20621&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20604&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20652&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20631&quot;,&quot;type&quot;:&quot;MultiLine&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20651&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;20632&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;20631&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;20634&quot;}},&quot;id&quot;:&quot;20633&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20639&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;end&quot;:[0,1,2,3,4,5,6,7],&quot;start&quot;:[0,0,0,0,0,0,0,0]},&quot;selected&quot;:{&quot;id&quot;:&quot;20651&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;20652&quot;}},&quot;id&quot;:&quot;20632&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;edge_renderer&quot;:{&quot;id&quot;:&quot;20633&quot;},&quot;inspection_policy&quot;:{&quot;id&quot;:&quot;20642&quot;},&quot;layout_provider&quot;:{&quot;id&quot;:&quot;20635&quot;},&quot;node_renderer&quot;:{&quot;id&quot;:&quot;20620&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;20641&quot;}},&quot;id&quot;:&quot;20617&quot;,&quot;type&quot;:&quot;GraphRenderer&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;20632&quot;}},&quot;id&quot;:&quot;20634&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Graph Layout Demonstration&quot;},&quot;id&quot;:&quot;20598&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;},&quot;id&quot;:&quot;20616&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;20639&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;20609&quot;}},&quot;id&quot;:&quot;20608&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20642&quot;,&quot;type&quot;:&quot;NodesOnly&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;field&quot;:&quot;color&quot;},&quot;height&quot;:{&quot;units&quot;:&quot;data&quot;,&quot;value&quot;:0.1},&quot;width&quot;:{&quot;units&quot;:&quot;data&quot;,&quot;value&quot;:0.2}},&quot;id&quot;:&quot;20626&quot;,&quot;type&quot;:&quot;Oval&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;20637&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;20613&quot;}},&quot;id&quot;:&quot;20612&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20641&quot;,&quot;type&quot;:&quot;NodesOnly&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;20608&quot;},&quot;ticker&quot;:null},&quot;id&quot;:&quot;20611&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20613&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;20612&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null},&quot;id&quot;:&quot;20615&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;end&quot;:1.1,&quot;start&quot;:-1.1},&quot;id&quot;:&quot;20600&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20606&quot;,&quot;type&quot;:&quot;LinearScale&quot;}],&quot;root_ids&quot;:[&quot;20597&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"036afc12-cb1b-48e6-9025-5026480cfd4c","root_ids":["20597"],"roots":{"20597":"e4f19926-7cd8-4df4-9c4d-1347bec7017d"}}];
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