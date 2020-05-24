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
    
      
      
    
      var element = document.getElementById("43879d9c-f006-4cf9-9ae4-21ed1de324eb");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid '43879d9c-f006-4cf9-9ae4-21ed1de324eb' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;6aa4a5ec-0720-4487-b39c-62b0e5046222&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17788&quot;,&quot;type&quot;:&quot;CategoricalTickFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17769&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;17759&quot;}},&quot;id&quot;:&quot;17799&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;#e84d60&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#e84d60&quot;},&quot;top&quot;:{&quot;field&quot;:&quot;2017&quot;},&quot;width&quot;:{&quot;value&quot;:0.2},&quot;x&quot;:{&quot;field&quot;:&quot;fruits&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;17808&quot;}}},&quot;id&quot;:&quot;17811&quot;,&quot;type&quot;:&quot;VBar&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#e84d60&quot;},&quot;line_color&quot;:{&quot;value&quot;:&quot;#e84d60&quot;},&quot;top&quot;:{&quot;field&quot;:&quot;2017&quot;},&quot;width&quot;:{&quot;value&quot;:0.2},&quot;x&quot;:{&quot;field&quot;:&quot;fruits&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;17808&quot;}}},&quot;id&quot;:&quot;17810&quot;,&quot;type&quot;:&quot;VBar&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;17759&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;17796&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;17797&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;17799&quot;}},&quot;id&quot;:&quot;17798&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;17788&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;17772&quot;}},&quot;id&quot;:&quot;17771&quot;,&quot;type&quot;:&quot;CategoricalAxis&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;17759&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;17781&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;17782&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;17784&quot;}},&quot;id&quot;:&quot;17783&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#718dbf&quot;},&quot;line_color&quot;:{&quot;value&quot;:&quot;#718dbf&quot;},&quot;top&quot;:{&quot;field&quot;:&quot;2016&quot;},&quot;width&quot;:{&quot;value&quot;:0.2},&quot;x&quot;:{&quot;field&quot;:&quot;fruits&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;17794&quot;}}},&quot;id&quot;:&quot;17796&quot;,&quot;type&quot;:&quot;VBar&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;#c9d9d3&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#c9d9d3&quot;},&quot;top&quot;:{&quot;field&quot;:&quot;2015&quot;},&quot;width&quot;:{&quot;value&quot;:0.2},&quot;x&quot;:{&quot;field&quot;:&quot;fruits&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;17779&quot;}}},&quot;id&quot;:&quot;17782&quot;,&quot;type&quot;:&quot;VBar&quot;},{&quot;attributes&quot;:{&quot;factors&quot;:[&quot;Apples&quot;,&quot;Pears&quot;,&quot;Nectarines&quot;,&quot;Plums&quot;,&quot;Grapes&quot;,&quot;Strawberries&quot;],&quot;range_padding&quot;:0.1},&quot;id&quot;:&quot;17763&quot;,&quot;type&quot;:&quot;FactorRange&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;17759&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;17810&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;17811&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;17813&quot;}},&quot;id&quot;:&quot;17812&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#c9d9d3&quot;},&quot;line_color&quot;:{&quot;value&quot;:&quot;#c9d9d3&quot;},&quot;top&quot;:{&quot;field&quot;:&quot;2015&quot;},&quot;width&quot;:{&quot;value&quot;:0.2},&quot;x&quot;:{&quot;field&quot;:&quot;fruits&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;17779&quot;}}},&quot;id&quot;:&quot;17781&quot;,&quot;type&quot;:&quot;VBar&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;17759&quot;}},&quot;id&quot;:&quot;17784&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;label&quot;:{&quot;value&quot;:&quot;2017&quot;},&quot;renderers&quot;:[{&quot;id&quot;:&quot;17812&quot;}]},&quot;id&quot;:&quot;17821&quot;,&quot;type&quot;:&quot;LegendItem&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Fruit Counts by Year&quot;},&quot;id&quot;:&quot;17761&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{&quot;label&quot;:{&quot;value&quot;:&quot;2015&quot;},&quot;renderers&quot;:[{&quot;id&quot;:&quot;17783&quot;}]},&quot;id&quot;:&quot;17793&quot;,&quot;type&quot;:&quot;LegendItem&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;#718dbf&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#718dbf&quot;},&quot;top&quot;:{&quot;field&quot;:&quot;2016&quot;},&quot;width&quot;:{&quot;value&quot;:0.2},&quot;x&quot;:{&quot;field&quot;:&quot;fruits&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;17794&quot;}}},&quot;id&quot;:&quot;17797&quot;,&quot;type&quot;:&quot;VBar&quot;},{&quot;attributes&quot;:{&quot;range&quot;:{&quot;id&quot;:&quot;17763&quot;},&quot;value&quot;:-0.25},&quot;id&quot;:&quot;17779&quot;,&quot;type&quot;:&quot;Dodge&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17791&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17790&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;17771&quot;},&quot;grid_line_color&quot;:null,&quot;ticker&quot;:null},&quot;id&quot;:&quot;17773&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;range&quot;:{&quot;id&quot;:&quot;17763&quot;}},&quot;id&quot;:&quot;17794&quot;,&quot;type&quot;:&quot;Dodge&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17772&quot;,&quot;type&quot;:&quot;CategoricalTicker&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;},&quot;id&quot;:&quot;17778&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;end&quot;:10},&quot;id&quot;:&quot;17765&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;2015&quot;:[2,1,4,3,2,4],&quot;2016&quot;:[5,3,3,2,4,6],&quot;2017&quot;:[3,2,4,4,5,3],&quot;fruits&quot;:[&quot;Apples&quot;,&quot;Pears&quot;,&quot;Nectarines&quot;,&quot;Plums&quot;,&quot;Grapes&quot;,&quot;Strawberries&quot;]},&quot;selected&quot;:{&quot;id&quot;:&quot;17790&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;17791&quot;}},&quot;id&quot;:&quot;17759&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17775&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17786&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;17786&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;17775&quot;}},&quot;id&quot;:&quot;17774&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;range&quot;:{&quot;id&quot;:&quot;17763&quot;},&quot;value&quot;:0.25},&quot;id&quot;:&quot;17808&quot;,&quot;type&quot;:&quot;Dodge&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;17759&quot;}},&quot;id&quot;:&quot;17813&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;17774&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null},&quot;id&quot;:&quot;17777&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;items&quot;:[{&quot;id&quot;:&quot;17793&quot;},{&quot;id&quot;:&quot;17807&quot;},{&quot;id&quot;:&quot;17821&quot;}],&quot;location&quot;:&quot;top_left&quot;,&quot;orientation&quot;:&quot;horizontal&quot;},&quot;id&quot;:&quot;17792&quot;,&quot;type&quot;:&quot;Legend&quot;},{&quot;attributes&quot;:{&quot;label&quot;:{&quot;value&quot;:&quot;2016&quot;},&quot;renderers&quot;:[{&quot;id&quot;:&quot;17798&quot;}]},&quot;id&quot;:&quot;17807&quot;,&quot;type&quot;:&quot;LegendItem&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;17771&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;17773&quot;},{&quot;id&quot;:&quot;17777&quot;},{&quot;id&quot;:&quot;17792&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;17774&quot;}],&quot;plot_height&quot;:250,&quot;renderers&quot;:[{&quot;id&quot;:&quot;17783&quot;},{&quot;id&quot;:&quot;17798&quot;},{&quot;id&quot;:&quot;17812&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;17761&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;17778&quot;},&quot;toolbar_location&quot;:null,&quot;x_range&quot;:{&quot;id&quot;:&quot;17763&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;17767&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;17765&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;17769&quot;}},&quot;id&quot;:&quot;17760&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;17767&quot;,&quot;type&quot;:&quot;CategoricalScale&quot;}],&quot;root_ids&quot;:[&quot;17760&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"6aa4a5ec-0720-4487-b39c-62b0e5046222","root_ids":["17760"],"roots":{"17760":"43879d9c-f006-4cf9-9ae4-21ed1de324eb"}}];
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