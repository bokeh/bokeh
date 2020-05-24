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
    
      
      
    
      var element = document.getElementById("ac99a101-74bd-4d14-9835-e68560aba66c");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid 'ac99a101-74bd-4d14-9835-e68560aba66c' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;aa2f075c-370a-4995-acb3-2274c54f0f9f&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;4345&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;4348&quot;},{&quot;id&quot;:&quot;4350&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;4346&quot;}],&quot;min_border&quot;:0,&quot;plot_height&quot;:300,&quot;plot_width&quot;:300,&quot;renderers&quot;:[{&quot;id&quot;:&quot;4343&quot;}],&quot;title&quot;:null,&quot;toolbar&quot;:{&quot;id&quot;:&quot;4353&quot;},&quot;toolbar_location&quot;:null,&quot;x_range&quot;:{&quot;id&quot;:&quot;4352&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;4354&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;4351&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;4355&quot;}},&quot;id&quot;:&quot;4340&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;4354&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:null,&quot;dimension&quot;:1,&quot;ticker&quot;:{&quot;id&quot;:&quot;4349&quot;}},&quot;id&quot;:&quot;4350&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;4355&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;x&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAAMAAAAAAAAD4vwAAAAAAAPC/AAAAAAAA4L8AAAAAAAAAAAAAAAAAAOA/AAAAAAAA8D8AAAAAAAD4PwAAAAAAAABA&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[9]},&quot;xm01&quot;:{&quot;__ndarray__&quot;:&quot;zMzMzMzM7L+amZmZmZnrvzQzMzMzM+O/AAAAAAAAyL8zMzMzMzPTPzMzMzMzM+k/MzMzMzMz8z9nZmZmZmb3PwAAAAAAAPg/&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[9]},&quot;y&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAEEAAAAAAAAACQAAAAAAAAPA/AAAAAAAA0D8AAAAAAAAAAAAAAAAAANA/AAAAAAAA8D8AAAAAAAACQAAAAAAAABBA&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[9]},&quot;ym01&quot;:{&quot;__ndarray__&quot;:&quot;ZmZmZmZmEEAzMzMzMzMEQGZmZmZmZvY/MzMzMzMz5z8AAAAAAADgPzMzMzMzM+c/ZmZmZmZm9j8zMzMzMzMEQGZmZmZmZhBA&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[9]}},&quot;selected&quot;:{&quot;id&quot;:&quot;4360&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;4361&quot;}},&quot;id&quot;:&quot;4339&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;4357&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;4352&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;4339&quot;}},&quot;id&quot;:&quot;4344&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:null,&quot;ticker&quot;:{&quot;id&quot;:&quot;4347&quot;}},&quot;id&quot;:&quot;4348&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;4361&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;},&quot;id&quot;:&quot;4353&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;4360&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;4351&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;4347&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;4349&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;4339&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;4342&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;4344&quot;}},&quot;id&quot;:&quot;4343&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;4357&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;4347&quot;}},&quot;id&quot;:&quot;4345&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;line_color&quot;:{&quot;value&quot;:&quot;#f4a582&quot;},&quot;line_width&quot;:{&quot;value&quot;:3},&quot;x0&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;x1&quot;:{&quot;field&quot;:&quot;xm01&quot;},&quot;y0&quot;:{&quot;field&quot;:&quot;y&quot;},&quot;y1&quot;:{&quot;field&quot;:&quot;ym01&quot;}},&quot;id&quot;:&quot;4342&quot;,&quot;type&quot;:&quot;Segment&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;4359&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;4349&quot;}},&quot;id&quot;:&quot;4346&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;4359&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;}],&quot;root_ids&quot;:[&quot;4340&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"aa2f075c-370a-4995-acb3-2274c54f0f9f","root_ids":["4340"],"roots":{"4340":"ac99a101-74bd-4d14-9835-e68560aba66c"}}];
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