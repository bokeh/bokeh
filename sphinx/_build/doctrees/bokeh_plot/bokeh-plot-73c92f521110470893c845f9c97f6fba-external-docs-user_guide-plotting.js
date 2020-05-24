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
    
      
      
    
      var element = document.getElementById("2ae8f1a0-55db-408b-8777-479ce1e3416c");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid '2ae8f1a0-55db-408b-8777-479ce1e3416c' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;6a54b38e-a6d9-4076-9c47-42aa0aab737d&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;red&quot;},&quot;line_color&quot;:{&quot;value&quot;:&quot;red&quot;},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;27951&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;27950&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;27951&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;27952&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;27954&quot;}},&quot;id&quot;:&quot;27953&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;&quot;},&quot;id&quot;:&quot;27962&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;27928&quot;},&quot;ticker&quot;:null},&quot;id&quot;:&quot;27931&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;,&quot;tools&quot;:[{&quot;id&quot;:&quot;27936&quot;},{&quot;id&quot;:&quot;27937&quot;},{&quot;id&quot;:&quot;27938&quot;},{&quot;id&quot;:&quot;27939&quot;},{&quot;id&quot;:&quot;27940&quot;},{&quot;id&quot;:&quot;27941&quot;}]},&quot;id&quot;:&quot;27943&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27936&quot;,&quot;type&quot;:&quot;PanTool&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;value&quot;:&quot;blue&quot;},&quot;line_color&quot;:{&quot;value&quot;:&quot;blue&quot;},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;27957&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;red&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;red&quot;},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;27952&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27924&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27929&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27940&quot;,&quot;type&quot;:&quot;ResetTool&quot;},{&quot;attributes&quot;:{&quot;bottom_units&quot;:&quot;screen&quot;,&quot;fill_alpha&quot;:0.5,&quot;fill_color&quot;:&quot;lightgrey&quot;,&quot;left_units&quot;:&quot;screen&quot;,&quot;level&quot;:&quot;overlay&quot;,&quot;line_alpha&quot;:1.0,&quot;line_color&quot;:&quot;black&quot;,&quot;line_dash&quot;:[4,4],&quot;line_width&quot;:2,&quot;right_units&quot;:&quot;screen&quot;,&quot;top_units&quot;:&quot;screen&quot;},&quot;id&quot;:&quot;27942&quot;,&quot;type&quot;:&quot;BoxAnnotation&quot;},{&quot;attributes&quot;:{&quot;end&quot;:100},&quot;id&quot;:&quot;27955&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27933&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27964&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;27956&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;27957&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;27958&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;27960&quot;},&quot;y_range_name&quot;:&quot;foo&quot;},&quot;id&quot;:&quot;27959&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;27932&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null},&quot;id&quot;:&quot;27935&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;27968&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;27929&quot;}},&quot;id&quot;:&quot;27928&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;end&quot;:6.5,&quot;start&quot;:-6.5},&quot;id&quot;:&quot;27920&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27967&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27937&quot;,&quot;type&quot;:&quot;WheelZoomTool&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;27964&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;27933&quot;}},&quot;id&quot;:&quot;27932&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27971&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;27928&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;27931&quot;},{&quot;id&quot;:&quot;27935&quot;}],&quot;extra_y_ranges&quot;:{&quot;foo&quot;:{&quot;id&quot;:&quot;27955&quot;}},&quot;left&quot;:[{&quot;id&quot;:&quot;27932&quot;},{&quot;id&quot;:&quot;27961&quot;}],&quot;renderers&quot;:[{&quot;id&quot;:&quot;27953&quot;},{&quot;id&quot;:&quot;27959&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;27962&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;27943&quot;},&quot;x_range&quot;:{&quot;id&quot;:&quot;27920&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;27924&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;27922&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;27926&quot;}},&quot;id&quot;:&quot;27919&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;x&quot;:{&quot;__ndarray__&quot;:&quot;GC1EVPshGcCyxt3tlLsYwExgd4cuVRjA5vkQIcjuF8CAk6q6YYgXwBotRFT7IRfAtMbd7ZS7FsBOYHeHLlUWwOj5ECHI7hXAgpOqumGIFcAcLURU+yEVwLbG3e2UuxTAUGB3hy5VFMDq+RAhyO4TwISTqrphiBPAHi1EVPshE8C4xt3tlLsSwFJgd4cuVRLA7PkQIcjuEcCGk6q6YYgRwCAtRFT7IRHAusbd7ZS7EMBUYHeHLlUQwNzzIUKQ3Q/AECdVdcMQD8BEWoio9kMOwHiNu9spdw3ArMDuDl2qDMDg8yFCkN0LwBQnVXXDEAvASFqIqPZDCsB8jbvbKXcJwLDA7g5dqgjA5PMhQpDdB8AYJ1V1wxAHwExaiKj2QwbAgI272yl3BcC0wO4OXaoEwOjzIUKQ3QPAHCdVdcMQA8BQWoio9kMCwISNu9spdwHAuMDuDl2qAMDY50OEILv/v0BOquqGIf6/qLQQUe2H/L8QG3e3U+76v3iB3R26VPm/4OdDhCC7979ITqrqhiH2v7C0EFHth/S/GBt3t1Pu8r+Agd0dulTxv9DPhwhBdu+/oJxU1Q1D7L9waSGi2g/pv0A27m6n3OW/EAO7O3Sp4r/Anw8Rguzev2A5qaobhti/ANNCRLUf0r9A2bi7nXLHvwAZ2N2hS7W/AAIG7943kT8AGltVkee9P8BZeneVwMs/QJMjIrFG1D+g+YmIF63aPwAwePe+ieA/MGOrKvK84z9glt5dJfDmP5DJEZFYI+o/wPxExItW7T/4F7x730TwP5CxVRV53vE/KEvvrhJ48z/A5IhIrBH1P1h+IuJFq/Y/8Be8e99E+D+IsVUVed75PyBL764SePs/uOSISKwR/T9QfiLiRav+P/QL3r1vIgBAwNiqijzvAECMpXdXCbwBQFhyRCTWiAJAJD8R8aJVA0DwC969byIEQLzYqoo87wRAiKV3Vwm8BUBUckQk1ogGQCA/EfGiVQdA7AvevW8iCEC42KqKPO8IQISld1cJvAlAUHJEJNaICkAcPxHxolULQOgL3r1vIgxAtNiqijzvDECApXdXCbwNQExyRCTWiA5AGD8R8aJVD0DyBe/eNxEQQFhsVUWedxBAvtK7qwTeEEAkOSISa0QRQIqfiHjRqhFA8AXv3jcREkBWbFVFnncSQLzSu6sE3hJAIjkiEmtEE0CIn4h40aoTQO4F7943ERRAVGxVRZ53FEC60rurBN4UQCA5IhJrRBVAhp+IeNGqFUDsBe/eNxEWQFJsVUWedxZAuNK7qwTeFkAeOSISa0QXQISfiHjRqhdA6gXv3jcRGEBQbFVFnncYQLbSu6sE3hhA&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[126]},&quot;y&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAAACamZmZmZnpP5qZmZmZmfk/NDMzMzMzA0CamZmZmZkJQAAAAAAAABBANDMzMzMzE0BnZmZmZmYWQJqZmZmZmRlAzczMzMzMHEAAAAAAAAAgQJqZmZmZmSFANDMzMzMzI0DNzMzMzMwkQGdmZmZmZiZAAAAAAAAAKECamZmZmZkpQDQzMzMzMytAzczMzMzMLEBnZmZmZmYuQAAAAAAAADBAzczMzMzMMECamZmZmZkxQGdmZmZmZjJANDMzMzMzM0AAAAAAAAA0QM3MzMzMzDRAmpmZmZmZNUBnZmZmZmY2QDQzMzMzMzdAAAAAAAAAOEDNzMzMzMw4QJqZmZmZmTlAZ2ZmZmZmOkA0MzMzMzM7QAAAAAAAADxAzczMzMzMPECamZmZmZk9QGdmZmZmZj5ANDMzMzMzP0AAAAAAAABAQGdmZmZmZkBAzczMzMzMQEAzMzMzMzNBQJqZmZmZmUFAAAAAAAAAQkBnZmZmZmZCQM3MzMzMzEJANDMzMzMzQ0CamZmZmZlDQAAAAAAAAERAZ2ZmZmZmREDNzMzMzMxEQDQzMzMzM0VAmpmZmZmZRUAAAAAAAABGQGdmZmZmZkZAzczMzMzMRkA0MzMzMzNHQJqZmZmZmUdAAAAAAAAASEBnZmZmZmZIQM3MzMzMzEhANDMzMzMzSUCamZmZmZlJQAAAAAAAAEpAZ2ZmZmZmSkDNzMzMzMxKQDQzMzMzM0tAmpmZmZmZS0AAAAAAAABMQGdmZmZmZkxAzczMzMzMTEA0MzMzMzNNQJqZmZmZmU1AAAAAAAAATkBnZmZmZmZOQM3MzMzMzE5ANDMzMzMzT0CamZmZmZlPQAAAAAAAAFBAMzMzMzMzUEBnZmZmZmZQQJqZmZmZmVBAzczMzMzMUEAAAAAAAABRQDMzMzMzM1FAZ2ZmZmZmUUCamZmZmZlRQM3MzMzMzFFAAAAAAAAAUkAzMzMzMzNSQGdmZmZmZlJAmpmZmZmZUkDNzMzMzMxSQAAAAAAAAFNANDMzMzMzU0BnZmZmZmZTQJqZmZmZmVNAzczMzMzMU0AAAAAAAABUQDQzMzMzM1RAZ2ZmZmZmVECamZmZmZlUQM3MzMzMzFRAAAAAAAAAVUA0MzMzMzNVQGdmZmZmZlVAmpmZmZmZVUDNzMzMzMxVQAAAAAAAAFZANDMzMzMzVkBnZmZmZmZWQJqZmZmZmVZAzczMzMzMVkAAAAAAAABXQDQzMzMzM1dAZ2ZmZmZmV0CamZmZmZlXQM3MzMzMzFdAAAAAAAAAWEA0MzMzMzNYQGdmZmZmZlhAmpmZmZmZWEDNzMzMzMxYQAAAAAAAAFlA&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[126]}},&quot;selected&quot;:{&quot;id&quot;:&quot;27973&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;27974&quot;}},&quot;id&quot;:&quot;27956&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27972&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;27950&quot;}},&quot;id&quot;:&quot;27954&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;x&quot;:{&quot;__ndarray__&quot;:&quot;GC1EVPshGcCyxt3tlLsYwExgd4cuVRjA5vkQIcjuF8CAk6q6YYgXwBotRFT7IRfAtMbd7ZS7FsBOYHeHLlUWwOj5ECHI7hXAgpOqumGIFcAcLURU+yEVwLbG3e2UuxTAUGB3hy5VFMDq+RAhyO4TwISTqrphiBPAHi1EVPshE8C4xt3tlLsSwFJgd4cuVRLA7PkQIcjuEcCGk6q6YYgRwCAtRFT7IRHAusbd7ZS7EMBUYHeHLlUQwNzzIUKQ3Q/AECdVdcMQD8BEWoio9kMOwHiNu9spdw3ArMDuDl2qDMDg8yFCkN0LwBQnVXXDEAvASFqIqPZDCsB8jbvbKXcJwLDA7g5dqgjA5PMhQpDdB8AYJ1V1wxAHwExaiKj2QwbAgI272yl3BcC0wO4OXaoEwOjzIUKQ3QPAHCdVdcMQA8BQWoio9kMCwISNu9spdwHAuMDuDl2qAMDY50OEILv/v0BOquqGIf6/qLQQUe2H/L8QG3e3U+76v3iB3R26VPm/4OdDhCC7979ITqrqhiH2v7C0EFHth/S/GBt3t1Pu8r+Agd0dulTxv9DPhwhBdu+/oJxU1Q1D7L9waSGi2g/pv0A27m6n3OW/EAO7O3Sp4r/Anw8Rguzev2A5qaobhti/ANNCRLUf0r9A2bi7nXLHvwAZ2N2hS7W/AAIG7943kT8AGltVkee9P8BZeneVwMs/QJMjIrFG1D+g+YmIF63aPwAwePe+ieA/MGOrKvK84z9glt5dJfDmP5DJEZFYI+o/wPxExItW7T/4F7x730TwP5CxVRV53vE/KEvvrhJ48z/A5IhIrBH1P1h+IuJFq/Y/8Be8e99E+D+IsVUVed75PyBL764SePs/uOSISKwR/T9QfiLiRav+P/QL3r1vIgBAwNiqijzvAECMpXdXCbwBQFhyRCTWiAJAJD8R8aJVA0DwC969byIEQLzYqoo87wRAiKV3Vwm8BUBUckQk1ogGQCA/EfGiVQdA7AvevW8iCEC42KqKPO8IQISld1cJvAlAUHJEJNaICkAcPxHxolULQOgL3r1vIgxAtNiqijzvDECApXdXCbwNQExyRCTWiA5AGD8R8aJVD0DyBe/eNxEQQFhsVUWedxBAvtK7qwTeEEAkOSISa0QRQIqfiHjRqhFA8AXv3jcREkBWbFVFnncSQLzSu6sE3hJAIjkiEmtEE0CIn4h40aoTQO4F7943ERRAVGxVRZ53FEC60rurBN4UQCA5IhJrRBVAhp+IeNGqFUDsBe/eNxEWQFJsVUWedxZAuNK7qwTeFkAeOSISa0QXQISfiHjRqhdA6gXv3jcRGEBQbFVFnncYQLbSu6sE3hhA&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[126]},&quot;y&quot;:{&quot;__ndarray__&quot;:&quot;B1wUMyamsTwky4vLro65P6zSPSP/bck/Jbq6lc3p0j9XZyvpOuzYP9gFS3Tort4/S0GlF40R4j+pGUZpbp3kP7z+v8KU9OY/MKhdmAMR6T/eDAmPVO3qPyhjLUzFhOw/t1UaokPT7T9BHsX5d9XuP/vgRN/NiO8/iG0sm3rr7z/HQuDHgfzvP72YL9e3u+8//RW9gcIp7z9qOBofF0juP2C00er2GO0/HHPrP2mf6z8x16rZM9/pP1MvWC3R3Oc/0tHD9WSd5T/vys8NrybjPwGGoLv8fuA/p6ckJDFa2z9p5l0jcnDVPz8ySNa4n84/z9a2bTgQwj9JFpiCD0qlP9gm6Dk3462/9Qq3ygIxxL+gS/8QyVrQv1Jhun47c9a/JdHwQ0FS3L/dGi7savTgv0DA7P9WlOO/crMfLS4C5r9cHtzduTfov3DI4npTL+q/lhLQ3/Lj67/viQE6O1Htv8QoRTGGc+6/Y0DHPe1H77+p7F0TUczvv1HsNw9f/++/DT4MmpTg77/B6yJ2QHDvv2CZ4PWBr+6/9yLYHEag7b8lJbqyQkXsv5cSvFTvoeq/3gUyl3y66L/SsApOyZPmv0H2lhdWM+S/OMh6STef4b8a4Y7HCrzdv3u+C2SY7de/LaSwivHh0b9m/jPXGVHHv0bTvttYRbW/xSXLwqk3kT/JIzUvK9a9PxjIxkANics//AfpL0vw0z91hzWkD+nZP4cP6pqNn98/ChrYG5SC4j9hCW3CCAblP+5iZOG2U+c/hMjjJbpl6T/Mcx3cxjbrP44pBXs3wuw/3a38hhgE7j/R9xCtMvnuPzNU7vwSn+8/IbeALBH07z+1XzrVU/fvP6DPKKDSqO8/pbRJW1YJ7z+JM+n3dhruP8RhK3eX3uw/Jfgtz99Y6z+f2l/YNI3pP+WxtFcugOc/zaIuPws35T/F08pCpLfiP3g4I+RcCOA/mTEMNiZg2j8025+JG2zUPwSg1R2oh8w/qzXOvj7cvz+ZZ0Soul6ZPxMepJQaPbO/RLIVCFdQxr8Pn7GuhmTRv7Nrs+BkdNe/O7QgoURI3b9ITvP1nmjhv9zlVSmUAOS/XGXQmV9l5r9ZNdHU4ZDov+SMb++Nfeq/d0LwuHcm7L9QJSxSYIftv8TXognBnO6/SRtzYNRj779HhCYhndrvv+yTLnbr/++/NaAP81/T77/KpXWIbFXvv+6vwmBTh+6/2k8AqCNr7b+D929HtAPsv7RWM6KcVOq/762gZSti6L8bWsKEWzHmvw8RMHvHx+O/52bX95or4b9I9bkoBsfcv2FS64I67da/RcPLJ8rY0L9F3NCChDLFvyPcIcx4+rC/&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[126]}},&quot;selected&quot;:{&quot;id&quot;:&quot;27971&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;27972&quot;}},&quot;id&quot;:&quot;27950&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;overlay&quot;:{&quot;id&quot;:&quot;27942&quot;}},&quot;id&quot;:&quot;27938&quot;,&quot;type&quot;:&quot;BoxZoomTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27973&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27939&quot;,&quot;type&quot;:&quot;SaveTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27966&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;27956&quot;}},&quot;id&quot;:&quot;27960&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27941&quot;,&quot;type&quot;:&quot;HelpTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27974&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;27966&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;27967&quot;},&quot;y_range_name&quot;:&quot;foo&quot;},&quot;id&quot;:&quot;27961&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;value&quot;:&quot;blue&quot;},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;line_color&quot;:{&quot;value&quot;:&quot;blue&quot;},&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;27958&quot;,&quot;type&quot;:&quot;Circle&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27926&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;end&quot;:1.1,&quot;start&quot;:-1.1},&quot;id&quot;:&quot;27922&quot;,&quot;type&quot;:&quot;Range1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;27968&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;}],&quot;root_ids&quot;:[&quot;27919&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"6a54b38e-a6d9-4076-9c47-42aa0aab737d","root_ids":["27919"],"roots":{"27919":"2ae8f1a0-55db-408b-8777-479ce1e3416c"}}];
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