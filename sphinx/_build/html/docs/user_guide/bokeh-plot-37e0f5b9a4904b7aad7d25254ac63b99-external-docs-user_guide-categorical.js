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
    
      
      
    
      var element = document.getElementById("a60ccdab-bf93-4880-be46-a8f1d5dc1017");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid 'a60ccdab-bf93-4880-be46-a8f1d5dc1017' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;f0e8c192-a684-464b-8405-bf63ba1ec399&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;18025&quot;}},&quot;id&quot;:&quot;18050&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;axis_label&quot;:&quot;some stuff&quot;,&quot;formatter&quot;:{&quot;id&quot;:&quot;18054&quot;},&quot;major_label_orientation&quot;:1.2,&quot;ticker&quot;:{&quot;id&quot;:&quot;18039&quot;}},&quot;id&quot;:&quot;18038&quot;,&quot;type&quot;:&quot;CategoricalAxis&quot;},{&quot;attributes&quot;:{&quot;start&quot;:0},&quot;id&quot;:&quot;18032&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{&quot;factors&quot;:[&quot;3&quot;,&quot;4&quot;,&quot;5&quot;,&quot;6&quot;,&quot;8&quot;]},&quot;id&quot;:&quot;18030&quot;,&quot;type&quot;:&quot;FactorRange&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;18052&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;18042&quot;}},&quot;id&quot;:&quot;18041&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18057&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18039&quot;,&quot;type&quot;:&quot;CategoricalTicker&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;},&quot;id&quot;:&quot;18045&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;field&quot;:&quot;cyl&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;18026&quot;}},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;field&quot;:&quot;cyl&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;18026&quot;}},&quot;top&quot;:{&quot;field&quot;:&quot;mpg_mean&quot;},&quot;width&quot;:{&quot;value&quot;:1},&quot;x&quot;:{&quot;field&quot;:&quot;cyl&quot;}},&quot;id&quot;:&quot;18048&quot;,&quot;type&quot;:&quot;VBar&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18036&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18054&quot;,&quot;type&quot;:&quot;CategoricalTickFormatter&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;field&quot;:&quot;cyl&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;18026&quot;}},&quot;line_color&quot;:{&quot;field&quot;:&quot;cyl&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;18026&quot;}},&quot;top&quot;:{&quot;field&quot;:&quot;mpg_mean&quot;},&quot;width&quot;:{&quot;value&quot;:1},&quot;x&quot;:{&quot;field&quot;:&quot;cyl&quot;}},&quot;id&quot;:&quot;18047&quot;,&quot;type&quot;:&quot;VBar&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;18038&quot;},&quot;grid_line_color&quot;:null,&quot;ticker&quot;:null},&quot;id&quot;:&quot;18040&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;MPG by # Cylinders&quot;},&quot;id&quot;:&quot;18028&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18052&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;factors&quot;:[&quot;3&quot;,&quot;4&quot;,&quot;5&quot;,&quot;6&quot;,&quot;8&quot;],&quot;palette&quot;:[&quot;#2b83ba&quot;,&quot;#abdda4&quot;,&quot;#ffffbf&quot;,&quot;#fdae61&quot;,&quot;#d7191c&quot;]},&quot;id&quot;:&quot;18026&quot;,&quot;type&quot;:&quot;CategoricalColorMapper&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;accel_25%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAACAKkCamZmZmZktQGZmZmZm5jFAmpmZmZkZLkAAAAAAAAAnQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;accel_50%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAK0AzMzMzMzMwQGZmZmZm5jNAAAAAAAAAMEAAAAAAAAAqQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;accel_75%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAK0AAAAAAAAAyQAAAAAAAADRAmpmZmZmZMUAAAAAAAAAsQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;accel_count&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAEEAAAAAAAOBoQAAAAAAAAAhAAAAAAADAVEAAAAAAAMBZQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;accel_max&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAK0DNzMzMzMw4QJqZmZmZGTRAAAAAAAAANUAzMzMzMzM2QA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;accel_mean&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAACAKkCRxCwG+JQwQCIiIiIiojJA7d9LWxRBMEA+LI1MIukpQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;accel_min&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAKUAzMzMzMzMnQM3MzMzMzC9AmpmZmZmZJkAAAAAAAAAgQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;accel_std&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAA4D+b1TA5wxADQO1jrP039AJA0StM4BRBAED/ZpysTswBQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;cyl&quot;:[&quot;3&quot;,&quot;4&quot;,&quot;5&quot;,&quot;6&quot;,&quot;8&quot;],&quot;displ_25%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAACAUUAAAAAAAMBWQAAAAAAAgF9AAAAAAADwaEAAAAAAABBzQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;displ_50%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAACAUUAAAAAAAEBaQAAAAAAAYGBAAAAAAADgbEAAAAAAAOB1QA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;displ_75%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAgUkAAAAAAAEBeQAAAAAAAoGNAAAAAAABAb0AAAAAAAIB2QA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;displ_count&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAEEAAAAAAAOBoQAAAAAAAAAhAAAAAAADAVEAAAAAAAMBZQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;displ_max&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAVEAAAAAAAIBjQAAAAAAA4GZAAAAAAABgcEAAAAAAAHB8QA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;displ_mean&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAgUkD/9sBG72pbQAAAAAAAIGJAmjq/9pBLa0DJeVnEJ5B1QA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;displ_min&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAACAUUAAAAAAAABRQAAAAAAAQF5AAAAAAAAgYkAAAAAAAEBwQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;displ_std&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAFEC8furRdmA1QLmT4WuwpEBAT4BvAbA2QEDXs8ZGYGNHQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;hp_25%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAADQV0AAAAAAAABRQAAAAAAAAFJAAAAAAAAgV0AAAAAAAIBhQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;hp_50%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAACgWEAAAAAAAIBTQAAAAAAAQFNAAAAAAAAAWUAAAAAAAMBiQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;hp_75%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAACgWUAAAAAAAABWQAAAAAAAgFZAAAAAAACAW0AAAAAAAOBlQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;hp_count&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAEEAAAAAAAOBoQAAAAAAAAAhAAAAAAADAVEAAAAAAAMBZQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;hp_max&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAACAW0AAAAAAAMBcQAAAAAAAwFlAAAAAAACgZEAAAAAAAMBsQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;hp_mean&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAADQWEB2PKeSApJTQFVVVVVVlVRAsD3ksmJgWUDCfquNocljQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;hp_min&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAACAVkAAAAAAAABHQAAAAAAAwFBAAAAAAAAAUkAAAAAAAIBWQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;hp_std&quot;:{&quot;__ndarray__&quot;:&quot;sTIWI2yaIECGr0Go0wstQDKsjxZJlTJAxZAwIvaeLEBQwZb3G3Q8QA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;mpg_25%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAADAMkAAAAAAAAA5QJqZmZmZ2TZAAAAAAAAAMkAAAAAAAAAqQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;mpg_50%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAABANEBmZmZmZmY8QGZmZmZmZjlAAAAAAAAAM0AAAAAAAAAsQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;mpg_75%&quot;:{&quot;__ndarray__&quot;:&quot;zczMzMwMNkCamZmZmXlAQGZmZmZm5j5AAAAAAAAANUAAAAAAAAAwQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;mpg_count&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAEEAAAAAAAOBoQAAAAAAAAAhAAAAAAADAVEAAAAAAAMBZQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;mpg_max&quot;:{&quot;__ndarray__&quot;:&quot;MzMzMzOzN0DNzMzMzExHQDMzMzMzM0JAAAAAAAAAQ0CamZmZmZk6QA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;mpg_mean&quot;:{&quot;__ndarray__&quot;:&quot;zczMzMyMNEBwD2z0rkg9QN3d3d3dXTtA6lu15jb5M0BgwH9VHO0tQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;mpg_min&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAMkAAAAAAAAAyQM3MzMzMTDRAAAAAAAAALkAAAAAAAAAiQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;mpg_std&quot;:{&quot;__ndarray__&quot;:&quot;ca9eOxmEBECNLXOmo64WQOWG1RfXdCBALURKf2ahDkC0cW7BtbAGQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;origin_25%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAACEAAAAAAAADwPwAAAAAAAABAAAAAAAAA8D8AAAAAAADwPw==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;origin_50%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAACEAAAAAAAAAAQAAAAAAAAABAAAAAAAAA8D8AAAAAAADwPw==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;origin_75%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAACEAAAAAAAAAIQAAAAAAAAABAAAAAAAAA8D8AAAAAAADwPw==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;origin_count&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAEEAAAAAAAOBoQAAAAAAAAAhAAAAAAADAVEAAAAAAAMBZQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;origin_max&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAACEAAAAAAAAAIQAAAAAAAAABAAAAAAAAACEAAAAAAAADwPw==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;origin_mean&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAACEAAAAAAAAAAQAAAAAAAAABAdX7tIZcV8z8AAAAAAADwPw==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;origin_min&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAACEAAAAAAAADwPwAAAAAAAABAAAAAAAAA8D8AAAAAAADwPw==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;origin_std&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAAACo00pJEbfqPwAAAAAAAAAAPS9VpaOj4T8AAAAAAAAAAA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;weight_25%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAADNoUAAAAAAAP6fQAAAAAAAlKZAAAAAAAACp0AAAAAAAK6tQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;weight_50%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAACOokAAAAAAAGyhQAAAAAAADKdAAAAAAAAUqUAAAAAAACywQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;weight_75%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAB+o0AAAAAAAAWkQAAAAAAAUKlAAAAAAADOqkAAAAAAgDOxQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;weight_count&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAEEAAAAAAAOBoQAAAAAAAAAhAAAAAAADAVEAAAAAAAMBZQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;weight_max&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAABApUAAAAAAAIypQAAAAAAAlKtAAAAAAACGrkAAAAAAABS0QA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;weight_mean&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAC9okAsMl+aOAKiQKuqqqqqPqhAjqbOrz0EqUBD0x3stxKwQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;weight_min&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAACYoEAAAAAAADSZQAAAAAAAHKZAAAAAAABQo0AAAAAAAByoQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;weight_std&quot;:{&quot;__ndarray__&quot;:&quot;udhs7B3ybkC6+VSg9G11QA9pSX6AZXdAdmeNgiLGdEC+UR6eVA18QA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;yr_25%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAwUkAAAAAAAIBSQAAAAAAAoFNAAAAAAACAUkAAAAAAAABSQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;yr_50%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAADAUkAAAAAAAEBTQAAAAAAAwFNAAAAAAAAAU0AAAAAAAEBSQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;yr_75%&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAABwU0AAAAAAAABUQAAAAAAA4FNAAAAAAACAU0AAAAAAAABTQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;yr_count&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAEEAAAAAAAOBoQAAAAAAAAAhAAAAAAADAVEAAAAAAAMBZQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;yr_max&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAVEAAAAAAAIBUQAAAAAAAAFRAAAAAAACAVEAAAAAAAEBUQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;yr_mean&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAADgUkDEWG397UFTQAAAAAAAwFNAghLeaOr8UkCL+ARSyXlSQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;yr_min&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAUkAAAAAAAIBRQAAAAAAAgFNAAAAAAACAUUAAAAAAAIBRQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]},&quot;yr_std&quot;:{&quot;__ndarray__&quot;:&quot;p1MQvCOTDUAd5PLGXeYNQAAAAAAAAPA/p0OY+nMdCkAEv1x2cisIQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[5]}},&quot;selected&quot;:{&quot;id&quot;:&quot;18056&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;18057&quot;}},&quot;id&quot;:&quot;18025&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18034&quot;,&quot;type&quot;:&quot;CategoricalScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18056&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;18038&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;18040&quot;},{&quot;id&quot;:&quot;18044&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;18041&quot;}],&quot;outline_line_color&quot;:null,&quot;plot_height&quot;:350,&quot;renderers&quot;:[{&quot;id&quot;:&quot;18049&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;18028&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;18045&quot;},&quot;toolbar_location&quot;:null,&quot;x_range&quot;:{&quot;id&quot;:&quot;18030&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;18034&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;18032&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;18036&quot;}},&quot;id&quot;:&quot;18027&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;18041&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null},&quot;id&quot;:&quot;18044&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;18025&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;18047&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;18048&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;18050&quot;}},&quot;id&quot;:&quot;18049&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18042&quot;,&quot;type&quot;:&quot;BasicTicker&quot;}],&quot;root_ids&quot;:[&quot;18027&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"f0e8c192-a684-464b-8405-bf63ba1ec399","root_ids":["18027"],"roots":{"18027":"a60ccdab-bf93-4880-be46-a8f1d5dc1017"}}];
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