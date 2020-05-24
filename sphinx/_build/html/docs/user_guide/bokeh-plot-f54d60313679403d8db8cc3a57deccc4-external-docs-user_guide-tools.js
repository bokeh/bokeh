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
    
      
      
    
      var element = document.getElementById("fe2a99a4-26c7-4532-b339-08f3bd633526");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid 'fe2a99a4-26c7-4532-b339-08f3bd633526' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;7edfc141-ce55-45bb-a110-0f38101394e5&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34373&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34375&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;background_fill_color&quot;:&quot;lightgrey&quot;,&quot;below&quot;:[{&quot;id&quot;:&quot;34348&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;34351&quot;},{&quot;id&quot;:&quot;34355&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;34352&quot;}],&quot;renderers&quot;:[{&quot;id&quot;:&quot;34361&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;34338&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;34356&quot;},&quot;x_range&quot;:{&quot;id&quot;:&quot;34340&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;34344&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;34342&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;34346&quot;}},&quot;id&quot;:&quot;34337&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34344&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;34357&quot;}},&quot;id&quot;:&quot;34362&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;field&quot;:&quot;color&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;field&quot;:&quot;color&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:10},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;34360&quot;,&quot;type&quot;:&quot;Scatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34383&quot;,&quot;type&quot;:&quot;StringEditor&quot;},{&quot;attributes&quot;:{&quot;editor&quot;:{&quot;id&quot;:&quot;34381&quot;},&quot;field&quot;:&quot;y&quot;,&quot;formatter&quot;:{&quot;id&quot;:&quot;34382&quot;},&quot;title&quot;:&quot;y&quot;},&quot;id&quot;:&quot;34364&quot;,&quot;type&quot;:&quot;TableColumn&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;34357&quot;}},&quot;id&quot;:&quot;34367&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;editor&quot;:{&quot;id&quot;:&quot;34379&quot;},&quot;field&quot;:&quot;x&quot;,&quot;formatter&quot;:{&quot;id&quot;:&quot;34380&quot;},&quot;title&quot;:&quot;x&quot;},&quot;id&quot;:&quot;34363&quot;,&quot;type&quot;:&quot;TableColumn&quot;},{&quot;attributes&quot;:{&quot;editor&quot;:{&quot;id&quot;:&quot;34383&quot;},&quot;field&quot;:&quot;color&quot;,&quot;formatter&quot;:{&quot;id&quot;:&quot;34384&quot;},&quot;title&quot;:&quot;color&quot;},&quot;id&quot;:&quot;34365&quot;,&quot;type&quot;:&quot;TableColumn&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;34357&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;34359&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;34360&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;34362&quot;}},&quot;id&quot;:&quot;34361&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;34373&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;34353&quot;}},&quot;id&quot;:&quot;34352&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;34352&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null},&quot;id&quot;:&quot;34355&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34353&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:{&quot;id&quot;:&quot;34368&quot;},&quot;tools&quot;:[{&quot;id&quot;:&quot;34368&quot;}]},&quot;id&quot;:&quot;34356&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;empty_value&quot;:&quot;black&quot;,&quot;renderers&quot;:[{&quot;id&quot;:&quot;34361&quot;}]},&quot;id&quot;:&quot;34368&quot;,&quot;type&quot;:&quot;PointDrawTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34346&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34382&quot;,&quot;type&quot;:&quot;StringFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34349&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;34375&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;34349&quot;}},&quot;id&quot;:&quot;34348&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;color&quot;:[&quot;red&quot;,&quot;green&quot;,&quot;yellow&quot;],&quot;x&quot;:[1,5,9],&quot;y&quot;:[1,5,9]},&quot;selected&quot;:{&quot;id&quot;:&quot;34377&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;34378&quot;}},&quot;id&quot;:&quot;34357&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;columns&quot;:[{&quot;id&quot;:&quot;34363&quot;},{&quot;id&quot;:&quot;34364&quot;},{&quot;id&quot;:&quot;34365&quot;}],&quot;editable&quot;:true,&quot;height&quot;:200,&quot;source&quot;:{&quot;id&quot;:&quot;34357&quot;},&quot;view&quot;:{&quot;id&quot;:&quot;34367&quot;}},&quot;id&quot;:&quot;34366&quot;,&quot;type&quot;:&quot;DataTable&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34377&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;end&quot;:10},&quot;id&quot;:&quot;34342&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{&quot;end&quot;:10},&quot;id&quot;:&quot;34340&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;34348&quot;},&quot;ticker&quot;:null},&quot;id&quot;:&quot;34351&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34378&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34381&quot;,&quot;type&quot;:&quot;StringEditor&quot;},{&quot;attributes&quot;:{&quot;children&quot;:[{&quot;id&quot;:&quot;34337&quot;},{&quot;id&quot;:&quot;34366&quot;}]},&quot;id&quot;:&quot;34371&quot;,&quot;type&quot;:&quot;Column&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34379&quot;,&quot;type&quot;:&quot;StringEditor&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34380&quot;,&quot;type&quot;:&quot;StringFormatter&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Point Draw Tool&quot;},&quot;id&quot;:&quot;34338&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;field&quot;:&quot;color&quot;},&quot;line_color&quot;:{&quot;field&quot;:&quot;color&quot;},&quot;size&quot;:{&quot;units&quot;:&quot;screen&quot;,&quot;value&quot;:10},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;34359&quot;,&quot;type&quot;:&quot;Scatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;34384&quot;,&quot;type&quot;:&quot;StringFormatter&quot;}],&quot;root_ids&quot;:[&quot;34371&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"7edfc141-ce55-45bb-a110-0f38101394e5","root_ids":["34371"],"roots":{"34371":"fe2a99a4-26c7-4532-b339-08f3bd633526"}}];
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