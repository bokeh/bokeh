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
    
      
      
    
      var element = document.getElementById("15283433-e038-4950-b1c4-3763dd28bdeb");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid '15283433-e038-4950-b1c4-3763dd28bdeb' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;b1c214fb-e1df-44a3-a467-3038c11649f7&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18209&quot;,&quot;type&quot;:&quot;CategoricalTickFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18186&quot;,&quot;type&quot;:&quot;PanTool&quot;},{&quot;attributes&quot;:{&quot;axis_label&quot;:&quot;Time (seconds)&quot;,&quot;formatter&quot;:{&quot;id&quot;:&quot;18207&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;18180&quot;}},&quot;id&quot;:&quot;18179&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;18179&quot;},&quot;ticker&quot;:null},&quot;id&quot;:&quot;18182&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;18179&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;18182&quot;},{&quot;id&quot;:&quot;18185&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;18183&quot;}],&quot;outline_line_color&quot;:null,&quot;plot_height&quot;:550,&quot;plot_width&quot;:400,&quot;renderers&quot;:[{&quot;id&quot;:&quot;18203&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;18169&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;18193&quot;},&quot;toolbar_location&quot;:null,&quot;x_range&quot;:{&quot;id&quot;:&quot;18171&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;18175&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;18173&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;18177&quot;}},&quot;id&quot;:&quot;18168&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{&quot;bottom_units&quot;:&quot;screen&quot;,&quot;fill_alpha&quot;:0.5,&quot;fill_color&quot;:&quot;lightgrey&quot;,&quot;left_units&quot;:&quot;screen&quot;,&quot;level&quot;:&quot;overlay&quot;,&quot;line_alpha&quot;:1.0,&quot;line_color&quot;:&quot;black&quot;,&quot;line_dash&quot;:[4,4],&quot;line_width&quot;:2,&quot;right_units&quot;:&quot;screen&quot;,&quot;top_units&quot;:&quot;screen&quot;},&quot;id&quot;:&quot;18192&quot;,&quot;type&quot;:&quot;BoxAnnotation&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;Time Spreads for Sprint Medalists (by Year)&quot;},&quot;id&quot;:&quot;18169&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18190&quot;,&quot;type&quot;:&quot;ResetTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18210&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;height&quot;:{&quot;value&quot;:0.4},&quot;left&quot;:{&quot;field&quot;:&quot;Time_min&quot;},&quot;line_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;right&quot;:{&quot;field&quot;:&quot;Time_max&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;Year&quot;}},&quot;id&quot;:&quot;18201&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;height&quot;:{&quot;value&quot;:0.4},&quot;left&quot;:{&quot;field&quot;:&quot;Time_min&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;#1f77b4&quot;},&quot;right&quot;:{&quot;field&quot;:&quot;Time_max&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;Year&quot;}},&quot;id&quot;:&quot;18202&quot;,&quot;type&quot;:&quot;HBar&quot;},{&quot;attributes&quot;:{&quot;factors&quot;:[&quot;1896&quot;,&quot;1900&quot;,&quot;1904&quot;,&quot;1906&quot;,&quot;1908&quot;,&quot;1912&quot;,&quot;1920&quot;,&quot;1924&quot;,&quot;1928&quot;,&quot;1932&quot;,&quot;1936&quot;,&quot;1948&quot;,&quot;1952&quot;,&quot;1956&quot;,&quot;1960&quot;,&quot;1964&quot;,&quot;1968&quot;,&quot;1972&quot;,&quot;1976&quot;,&quot;1980&quot;,&quot;1984&quot;,&quot;1988&quot;,&quot;1992&quot;,&quot;1996&quot;,&quot;2000&quot;,&quot;2004&quot;,&quot;2008&quot;,&quot;2012&quot;]},&quot;id&quot;:&quot;18173&quot;,&quot;type&quot;:&quot;FactorRange&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;18209&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;18184&quot;}},&quot;id&quot;:&quot;18183&quot;,&quot;type&quot;:&quot;CategoricalAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18189&quot;,&quot;type&quot;:&quot;SaveTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18191&quot;,&quot;type&quot;:&quot;HelpTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18177&quot;,&quot;type&quot;:&quot;CategoricalScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18211&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;,&quot;tools&quot;:[{&quot;id&quot;:&quot;18186&quot;},{&quot;id&quot;:&quot;18187&quot;},{&quot;id&quot;:&quot;18188&quot;},{&quot;id&quot;:&quot;18189&quot;},{&quot;id&quot;:&quot;18190&quot;},{&quot;id&quot;:&quot;18191&quot;}]},&quot;id&quot;:&quot;18193&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;18167&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;18201&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;18202&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;18204&quot;}},&quot;id&quot;:&quot;18203&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18187&quot;,&quot;type&quot;:&quot;WheelZoomTool&quot;},{&quot;attributes&quot;:{&quot;overlay&quot;:{&quot;id&quot;:&quot;18192&quot;}},&quot;id&quot;:&quot;18188&quot;,&quot;type&quot;:&quot;BoxZoomTool&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;Time_25%&quot;:{&quot;__ndarray__&quot;:&quot;zMzMzMxMKECamZmZmRkmQDMzMzMzMyZAAAAAAACAJkDNzMzMzMwlQDQzMzMzsyVANDMzMzOzJUBmZmZmZmYlQDQzMzMzsyVAmpmZmZmZJEA0MzMzM7MkQDQzMzMzsyRAzczMzMzMJEAAAAAAAAAlQGZmZmZmZiRAMzMzMzMzJEA9CtejcP0jQOJ6FK5HYSRApHA9CtcjJEAAAAAAAIAkQK5H4XoULiRApHA9CtfjI0B7FK5H4fojQHsUrkfhuiNAXI/C9SjcI0D2KFyPwrUjQBSuR+F6lCNA4noUrkdhI0A=&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[28]},&quot;Time_50%&quot;:{&quot;__ndarray__&quot;:&quot;zMzMzMzMKEAzMzMzMzMmQGZmZmZmZiZAmpmZmZmZJkAAAAAAAAAmQM3MzMzMzCVAzczMzMzMJUCamZmZmZklQM3MzMzMzCVAmpmZmZmZJEDNzMzMzMwkQM3MzMzMzCRAzczMzMzMJEAAAAAAAAAlQGZmZmZmZiRAZmZmZmZmJEAUrkfhehQkQHsUrkfheiRAKVyPwvUoJEAAAAAAAIAkQOF6FK5HYSRAcT0K16PwI0AK16NwPQokQEjhehSuxyNAexSuR+H6I0C4HoXrUbgjQEjhehSuxyNAAAAAAACAI0A=&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[28]},&quot;Time_75%&quot;:{&quot;__ndarray__&quot;:&quot;MzMzMzMzKUDMzMzMzEwmQGZmZmZmZiZAmpmZmZmZJkAAAAAAAAAmQM3MzMzMzCVAzczMzMzMJUA0MzMzM7MlQM3MzMzMzCVANDMzMzOzJEBmZmZmZuYkQM3MzMzMzCRAzczMzMzMJECamZmZmRklQAAAAAAAgCRAZmZmZmZmJEBcj8L1KBwkQFK4HoXrkSRAuB6F61E4JECkcD0K16MkQClcj8L1aCRA9ihcj8L1I0CPwvUoXA8kQArXo3A9yiNASOF6FK4HJEB6FK5H4bojQM3MzMzMzCNACtejcD2KI0A=&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[28]},&quot;Time_count&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAEEAAAAAAAAAIQAAAAAAAAAhAAAAAAAAACEAAAAAAAAAIQAAAAAAAAAhAAAAAAAAACEAAAAAAAAAIQAAAAAAAAAhAAAAAAAAACEAAAAAAAAAIQAAAAAAAAAhAAAAAAAAACEAAAAAAAAAIQAAAAAAAAAhAAAAAAAAACEAAAAAAAAAIQAAAAAAAAAhAAAAAAAAACEAAAAAAAAAIQAAAAAAAAAhAAAAAAAAACEAAAAAAAAAIQAAAAAAAAAhAAAAAAAAACEAAAAAAAAAIQAAAAAAAAAhAAAAAAAAACEA=&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[28]},&quot;Time_max&quot;:{&quot;__ndarray__&quot;:&quot;MzMzMzMzKUBmZmZmZmYmQGZmZmZmZiZAmpmZmZmZJkAAAAAAAAAmQM3MzMzMzCVAzczMzMzMJUDNzMzMzMwlQM3MzMzMzCVAzczMzMzMJEAAAAAAAAAlQM3MzMzMzCRAzczMzMzMJEAzMzMzMzMlQJqZmZmZmSRAZmZmZmZmJECkcD0K1yMkQClcj8L1qCRASOF6FK5HJEBI4XoUrsckQHE9CtejcCRAexSuR+H6I0AUrkfhehQkQM3MzMzMzCNAFK5H4XoUJEA9CtejcL0jQFK4HoXr0SNAFK5H4XqUI0A=&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[28]},&quot;Time_mean&quot;:{&quot;__ndarray__&quot;:&quot;MzMzMzOzKEAzMzMzMzMmQERERERERCZAiIiIiIiIJkDd3d3d3d0lQLy7u7u7uyVAvLu7u7u7JUCIiIiIiIglQLy7u7u7uyVAq6qqqqqqJEDNzMzMzMwkQLy7u7u7uyRAzczMzMzMJEARERERERElQHd3d3d3dyRAREREREREJEAK16NwPQokQPnFkl8seSRAMJb8YskvJEAYS36x5JckQERERERERCRA7FG4HoXrI0ADnTbQaQMkQEGnDXTawCNA7+7u7u7uI0C4HoXrUbgjQClcj8L1qCNA84slv1hyI0A=&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[28]},&quot;Time_min&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAKEAAAAAAAAAmQAAAAAAAACZAZmZmZmZmJkCamZmZmZklQJqZmZmZmSVAmpmZmZmZJUAzMzMzMzMlQJqZmZmZmSVAmpmZmZmZJECamZmZmZkkQJqZmZmZmSRAzczMzMzMJEAAAAAAAAAlQGZmZmZmZiRAAAAAAAAAJEBmZmZmZuYjQEjhehSuRyRAH4XrUbgeJEAAAAAAAIAkQHsUrkfh+iNA16NwPQrXI0DsUbgehesjQK5H4XoUriNAPQrXo3C9I0AzMzMzM7MjQOF6FK5HYSNAw/UoXI9CI0A=&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[28]},&quot;Time_std&quot;:{&quot;__ndarray__&quot;:&quot;MjMzMzMz0z+AmZmZmZm5PxC45ghyj70/pLjmCHKPrT8QuOYIco+9PxC45ghyj60/ELjmCHKPrT+dILAJZY3DPxC45ghyj60/ELjmCHKPrT+AmZmZmZm5PxC45ghyj60/AAAAAAAAAAAQuOYIco+tP6S45ghyj60/ELjmCHKPvT/ciVWbcfmvP7L4aTHLVLg/1FuOZ/ZQpT/RTW45NrG0P6MWP5UXAcA/K04+QN51oj9EW45n9lClPyJ8NxRgdaA/zW20vM9dtj8AFK5H4XqEP/tCvWrMJL8/jFuOZ/ZQtT8=&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[28]},&quot;Year&quot;:[&quot;1896&quot;,&quot;1900&quot;,&quot;1904&quot;,&quot;1906&quot;,&quot;1908&quot;,&quot;1912&quot;,&quot;1920&quot;,&quot;1924&quot;,&quot;1928&quot;,&quot;1932&quot;,&quot;1936&quot;,&quot;1948&quot;,&quot;1952&quot;,&quot;1956&quot;,&quot;1960&quot;,&quot;1964&quot;,&quot;1968&quot;,&quot;1972&quot;,&quot;1976&quot;,&quot;1980&quot;,&quot;1984&quot;,&quot;1988&quot;,&quot;1992&quot;,&quot;1996&quot;,&quot;2000&quot;,&quot;2004&quot;,&quot;2008&quot;,&quot;2012&quot;]},&quot;selected&quot;:{&quot;id&quot;:&quot;18210&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;18211&quot;}},&quot;id&quot;:&quot;18167&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;18167&quot;}},&quot;id&quot;:&quot;18204&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18184&quot;,&quot;type&quot;:&quot;CategoricalTicker&quot;},{&quot;attributes&quot;:{&quot;end&quot;:12.7,&quot;start&quot;:9.5},&quot;id&quot;:&quot;18171&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18207&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18175&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18180&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;18183&quot;},&quot;dimension&quot;:1,&quot;grid_line_color&quot;:null,&quot;ticker&quot;:null},&quot;id&quot;:&quot;18185&quot;,&quot;type&quot;:&quot;Grid&quot;}],&quot;root_ids&quot;:[&quot;18168&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"b1c214fb-e1df-44a3-a467-3038c11649f7","root_ids":["18168"],"roots":{"18168":"15283433-e038-4950-b1c4-3763dd28bdeb"}}];
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