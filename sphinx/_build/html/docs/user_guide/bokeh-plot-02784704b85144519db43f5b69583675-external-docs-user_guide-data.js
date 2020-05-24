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
    
      
      
    
      var element = document.getElementById("4cc1b9aa-9540-409e-a162-6f829e84cbb7");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid '4cc1b9aa-9540-409e-a162-6f829e84cbb7' but no matching script tag was found.")
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
                    
                  var docs_json = '{&quot;9a377fcc-fb40-45d2-82a8-39f0f5ecd1df&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18875&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18858&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;fill_color&quot;:{&quot;field&quot;:&quot;counts&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;18862&quot;}},&quot;q&quot;:{&quot;field&quot;:&quot;q&quot;},&quot;r&quot;:{&quot;field&quot;:&quot;r&quot;},&quot;size&quot;:0.1},&quot;id&quot;:&quot;18865&quot;,&quot;type&quot;:&quot;HexTile&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;},&quot;id&quot;:&quot;18861&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;fill_alpha&quot;:{&quot;value&quot;:0.1},&quot;fill_color&quot;:{&quot;field&quot;:&quot;counts&quot;,&quot;transform&quot;:{&quot;id&quot;:&quot;18862&quot;}},&quot;line_alpha&quot;:{&quot;value&quot;:0.1},&quot;q&quot;:{&quot;field&quot;:&quot;q&quot;},&quot;r&quot;:{&quot;field&quot;:&quot;r&quot;},&quot;size&quot;:0.1},&quot;id&quot;:&quot;18866&quot;,&quot;type&quot;:&quot;HexTile&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;18857&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null,&quot;visible&quot;:false},&quot;id&quot;:&quot;18860&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;18872&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;18854&quot;}},&quot;id&quot;:&quot;18853&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;background_fill_color&quot;:&quot;#440154&quot;,&quot;below&quot;:[{&quot;id&quot;:&quot;18853&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;18856&quot;},{&quot;id&quot;:&quot;18860&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;18857&quot;}],&quot;match_aspect&quot;:true,&quot;renderers&quot;:[{&quot;id&quot;:&quot;18867&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;18869&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;18861&quot;},&quot;x_range&quot;:{&quot;id&quot;:&quot;18845&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;18849&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;18847&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;18851&quot;}},&quot;id&quot;:&quot;18844&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18872&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;high&quot;:232,&quot;low&quot;:0,&quot;palette&quot;:[&quot;#440154&quot;,&quot;#440255&quot;,&quot;#440357&quot;,&quot;#450558&quot;,&quot;#45065A&quot;,&quot;#45085B&quot;,&quot;#46095C&quot;,&quot;#460B5E&quot;,&quot;#460C5F&quot;,&quot;#460E61&quot;,&quot;#470F62&quot;,&quot;#471163&quot;,&quot;#471265&quot;,&quot;#471466&quot;,&quot;#471567&quot;,&quot;#471669&quot;,&quot;#47186A&quot;,&quot;#48196B&quot;,&quot;#481A6C&quot;,&quot;#481C6E&quot;,&quot;#481D6F&quot;,&quot;#481E70&quot;,&quot;#482071&quot;,&quot;#482172&quot;,&quot;#482273&quot;,&quot;#482374&quot;,&quot;#472575&quot;,&quot;#472676&quot;,&quot;#472777&quot;,&quot;#472878&quot;,&quot;#472A79&quot;,&quot;#472B7A&quot;,&quot;#472C7B&quot;,&quot;#462D7C&quot;,&quot;#462F7C&quot;,&quot;#46307D&quot;,&quot;#46317E&quot;,&quot;#45327F&quot;,&quot;#45347F&quot;,&quot;#453580&quot;,&quot;#453681&quot;,&quot;#443781&quot;,&quot;#443982&quot;,&quot;#433A83&quot;,&quot;#433B83&quot;,&quot;#433C84&quot;,&quot;#423D84&quot;,&quot;#423E85&quot;,&quot;#424085&quot;,&quot;#414186&quot;,&quot;#414286&quot;,&quot;#404387&quot;,&quot;#404487&quot;,&quot;#3F4587&quot;,&quot;#3F4788&quot;,&quot;#3E4888&quot;,&quot;#3E4989&quot;,&quot;#3D4A89&quot;,&quot;#3D4B89&quot;,&quot;#3D4C89&quot;,&quot;#3C4D8A&quot;,&quot;#3C4E8A&quot;,&quot;#3B508A&quot;,&quot;#3B518A&quot;,&quot;#3A528B&quot;,&quot;#3A538B&quot;,&quot;#39548B&quot;,&quot;#39558B&quot;,&quot;#38568B&quot;,&quot;#38578C&quot;,&quot;#37588C&quot;,&quot;#37598C&quot;,&quot;#365A8C&quot;,&quot;#365B8C&quot;,&quot;#355C8C&quot;,&quot;#355D8C&quot;,&quot;#345E8D&quot;,&quot;#345F8D&quot;,&quot;#33608D&quot;,&quot;#33618D&quot;,&quot;#32628D&quot;,&quot;#32638D&quot;,&quot;#31648D&quot;,&quot;#31658D&quot;,&quot;#31668D&quot;,&quot;#30678D&quot;,&quot;#30688D&quot;,&quot;#2F698D&quot;,&quot;#2F6A8D&quot;,&quot;#2E6B8E&quot;,&quot;#2E6C8E&quot;,&quot;#2E6D8E&quot;,&quot;#2D6E8E&quot;,&quot;#2D6F8E&quot;,&quot;#2C708E&quot;,&quot;#2C718E&quot;,&quot;#2C728E&quot;,&quot;#2B738E&quot;,&quot;#2B748E&quot;,&quot;#2A758E&quot;,&quot;#2A768E&quot;,&quot;#2A778E&quot;,&quot;#29788E&quot;,&quot;#29798E&quot;,&quot;#287A8E&quot;,&quot;#287A8E&quot;,&quot;#287B8E&quot;,&quot;#277C8E&quot;,&quot;#277D8E&quot;,&quot;#277E8E&quot;,&quot;#267F8E&quot;,&quot;#26808E&quot;,&quot;#26818E&quot;,&quot;#25828E&quot;,&quot;#25838D&quot;,&quot;#24848D&quot;,&quot;#24858D&quot;,&quot;#24868D&quot;,&quot;#23878D&quot;,&quot;#23888D&quot;,&quot;#23898D&quot;,&quot;#22898D&quot;,&quot;#228A8D&quot;,&quot;#228B8D&quot;,&quot;#218C8D&quot;,&quot;#218D8C&quot;,&quot;#218E8C&quot;,&quot;#208F8C&quot;,&quot;#20908C&quot;,&quot;#20918C&quot;,&quot;#1F928C&quot;,&quot;#1F938B&quot;,&quot;#1F948B&quot;,&quot;#1F958B&quot;,&quot;#1F968B&quot;,&quot;#1E978A&quot;,&quot;#1E988A&quot;,&quot;#1E998A&quot;,&quot;#1E998A&quot;,&quot;#1E9A89&quot;,&quot;#1E9B89&quot;,&quot;#1E9C89&quot;,&quot;#1E9D88&quot;,&quot;#1E9E88&quot;,&quot;#1E9F88&quot;,&quot;#1EA087&quot;,&quot;#1FA187&quot;,&quot;#1FA286&quot;,&quot;#1FA386&quot;,&quot;#20A485&quot;,&quot;#20A585&quot;,&quot;#21A685&quot;,&quot;#21A784&quot;,&quot;#22A784&quot;,&quot;#23A883&quot;,&quot;#23A982&quot;,&quot;#24AA82&quot;,&quot;#25AB81&quot;,&quot;#26AC81&quot;,&quot;#27AD80&quot;,&quot;#28AE7F&quot;,&quot;#29AF7F&quot;,&quot;#2AB07E&quot;,&quot;#2BB17D&quot;,&quot;#2CB17D&quot;,&quot;#2EB27C&quot;,&quot;#2FB37B&quot;,&quot;#30B47A&quot;,&quot;#32B57A&quot;,&quot;#33B679&quot;,&quot;#35B778&quot;,&quot;#36B877&quot;,&quot;#38B976&quot;,&quot;#39B976&quot;,&quot;#3BBA75&quot;,&quot;#3DBB74&quot;,&quot;#3EBC73&quot;,&quot;#40BD72&quot;,&quot;#42BE71&quot;,&quot;#44BE70&quot;,&quot;#45BF6F&quot;,&quot;#47C06E&quot;,&quot;#49C16D&quot;,&quot;#4BC26C&quot;,&quot;#4DC26B&quot;,&quot;#4FC369&quot;,&quot;#51C468&quot;,&quot;#53C567&quot;,&quot;#55C666&quot;,&quot;#57C665&quot;,&quot;#59C764&quot;,&quot;#5BC862&quot;,&quot;#5EC961&quot;,&quot;#60C960&quot;,&quot;#62CA5F&quot;,&quot;#64CB5D&quot;,&quot;#67CC5C&quot;,&quot;#69CC5B&quot;,&quot;#6BCD59&quot;,&quot;#6DCE58&quot;,&quot;#70CE56&quot;,&quot;#72CF55&quot;,&quot;#74D054&quot;,&quot;#77D052&quot;,&quot;#79D151&quot;,&quot;#7CD24F&quot;,&quot;#7ED24E&quot;,&quot;#81D34C&quot;,&quot;#83D34B&quot;,&quot;#86D449&quot;,&quot;#88D547&quot;,&quot;#8BD546&quot;,&quot;#8DD644&quot;,&quot;#90D643&quot;,&quot;#92D741&quot;,&quot;#95D73F&quot;,&quot;#97D83E&quot;,&quot;#9AD83C&quot;,&quot;#9DD93A&quot;,&quot;#9FD938&quot;,&quot;#A2DA37&quot;,&quot;#A5DA35&quot;,&quot;#A7DB33&quot;,&quot;#AADB32&quot;,&quot;#ADDC30&quot;,&quot;#AFDC2E&quot;,&quot;#B2DD2C&quot;,&quot;#B5DD2B&quot;,&quot;#B7DD29&quot;,&quot;#BADE27&quot;,&quot;#BDDE26&quot;,&quot;#BFDF24&quot;,&quot;#C2DF22&quot;,&quot;#C5DF21&quot;,&quot;#C7E01F&quot;,&quot;#CAE01E&quot;,&quot;#CDE01D&quot;,&quot;#CFE11C&quot;,&quot;#D2E11B&quot;,&quot;#D4E11A&quot;,&quot;#D7E219&quot;,&quot;#DAE218&quot;,&quot;#DCE218&quot;,&quot;#DFE318&quot;,&quot;#E1E318&quot;,&quot;#E4E318&quot;,&quot;#E7E419&quot;,&quot;#E9E419&quot;,&quot;#ECE41A&quot;,&quot;#EEE51B&quot;,&quot;#F1E51C&quot;,&quot;#F3E51E&quot;,&quot;#F6E61F&quot;,&quot;#F8E621&quot;,&quot;#FAE622&quot;,&quot;#FDE724&quot;]},&quot;id&quot;:&quot;18862&quot;,&quot;type&quot;:&quot;LinearColorMapper&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18849&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;18863&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;18865&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;18866&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;18868&quot;}},&quot;id&quot;:&quot;18867&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18851&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;counts&quot;:[1,1,1,1,2,2,1,1,1,1,1,2,1,2,1,1,1,1,1,2,4,1,1,1,1,2,1,3,1,1,1,1,1,2,3,3,1,1,1,2,1,2,4,1,5,1,4,2,5,4,1,3,2,1,3,1,1,1,1,2,2,1,2,6,4,2,4,4,7,2,3,1,2,7,1,1,2,1,1,2,1,4,1,4,2,4,3,5,5,6,7,5,5,9,3,4,2,4,4,3,2,2,2,2,1,1,1,3,4,4,4,4,5,6,4,7,14,13,8,6,6,9,9,5,4,5,3,2,1,1,1,1,1,1,1,1,1,5,1,5,9,9,11,6,11,13,14,11,11,9,12,3,8,6,1,4,1,4,1,1,3,2,1,4,2,8,6,11,4,10,16,13,25,13,13,23,14,10,12,7,19,13,8,10,4,5,4,2,1,1,1,1,1,2,2,4,5,7,13,7,13,15,15,22,17,21,21,24,24,10,16,19,19,15,8,12,12,5,3,3,3,2,1,1,4,3,2,5,4,5,12,10,17,23,21,21,17,24,36,36,19,30,22,20,25,19,16,8,10,4,2,2,4,3,1,1,2,1,1,3,1,6,7,5,10,17,18,25,22,38,41,44,29,55,48,43,35,26,30,23,31,9,9,8,7,7,9,3,3,4,2,10,3,6,3,11,15,7,19,22,40,42,37,30,52,51,65,49,63,51,45,47,26,31,28,21,16,16,10,7,2,3,1,1,1,3,3,4,5,9,18,12,24,33,26,41,53,41,46,65,55,64,47,60,48,48,50,35,23,27,23,14,18,6,6,4,2,2,1,1,3,6,2,13,15,17,22,29,47,47,68,66,74,75,69,77,88,85,70,65,73,52,52,34,21,24,14,12,5,2,1,3,2,1,1,1,1,1,3,1,6,6,14,16,18,31,31,46,55,69,92,74,96,110,83,101,115,92,74,82,57,34,36,31,20,18,8,8,2,5,2,1,1,1,1,1,3,4,2,11,19,31,28,34,61,64,83,92,95,102,113,110,132,101,127,94,83,79,58,47,42,29,16,15,18,10,8,5,2,1,1,1,1,2,1,1,1,6,4,16,20,20,32,56,37,64,67,75,99,120,124,146,137,123,144,133,99,97,93,58,59,43,31,18,15,16,3,4,3,2,1,1,1,2,1,1,1,3,7,6,10,14,19,27,36,57,76,78,100,99,147,117,156,144,132,160,151,120,114,103,78,63,62,44,23,26,14,6,5,1,4,1,1,1,1,1,3,5,10,19,20,28,39,51,74,91,103,111,132,143,162,156,160,169,153,157,146,120,102,82,70,44,39,28,29,14,5,2,3,3,2,1,2,2,9,9,21,21,43,42,71,72,96,113,134,180,152,180,186,195,182,151,167,148,111,91,88,60,58,39,17,12,9,4,5,4,1,1,1,1,1,2,3,8,10,12,17,30,37,36,62,89,108,121,130,153,170,187,192,190,187,200,165,182,140,119,100,66,64,36,27,16,14,10,7,2,2,1,1,1,1,1,1,3,2,2,11,21,15,24,43,54,83,54,122,135,140,172,178,185,213,223,221,177,183,154,120,96,87,57,54,26,30,24,12,13,10,1,3,3,1,1,1,1,3,2,5,9,9,14,19,25,37,71,78,95,98,167,145,195,195,186,182,195,206,193,147,147,122,105,82,66,59,31,29,18,10,11,10,1,1,1,2,1,1,1,3,2,14,17,18,26,45,55,68,91,136,111,138,179,203,220,181,205,197,185,161,151,118,93,103,70,37,42,31,17,11,9,5,2,1,3,1,1,1,2,2,6,14,16,31,26,49,68,77,104,115,142,135,170,200,183,197,202,177,169,161,126,121,98,91,66,56,26,17,11,8,8,4,2,1,2,1,3,1,8,8,16,21,27,41,56,63,83,90,109,141,156,185,199,232,181,174,152,154,125,103,97,70,76,44,25,28,26,8,10,6,3,3,2,2,2,3,5,3,4,13,10,21,25,42,45,67,71,94,116,144,153,158,196,171,185,167,145,132,114,105,77,66,54,41,19,13,16,7,8,2,2,2,1,3,3,3,6,11,15,19,30,46,60,83,80,83,116,134,149,160,145,166,126,154,137,122,86,63,72,54,37,26,16,15,11,11,5,2,1,1,2,1,1,1,4,1,8,10,20,24,32,46,55,85,77,80,125,107,129,133,143,147,128,132,101,100,82,69,55,35,32,27,18,18,3,5,3,2,1,1,1,6,6,8,9,19,19,32,30,42,68,84,80,84,101,113,110,135,119,104,96,92,94,64,55,26,43,23,10,11,8,4,3,1,1,1,1,3,3,5,3,7,12,12,28,38,43,58,62,64,75,79,99,92,113,93,97,78,67,63,63,41,47,32,29,13,14,4,8,4,1,2,1,1,1,1,1,1,5,5,5,14,18,25,21,47,43,65,63,63,66,65,85,76,78,59,53,62,53,27,32,36,23,17,8,14,3,6,5,2,1,1,2,1,2,5,8,18,17,14,19,21,43,45,63,58,77,69,74,57,65,49,54,51,31,30,23,25,15,10,10,10,5,3,1,1,1,3,3,4,9,8,13,15,30,31,32,27,45,46,46,45,50,44,45,39,44,37,33,25,19,23,11,10,7,6,3,1,1,1,3,2,1,4,4,9,11,11,25,26,31,36,40,44,39,42,42,42,39,27,32,12,25,15,15,8,3,6,3,1,1,1,2,2,3,5,5,6,11,18,13,20,15,19,23,20,27,29,27,26,37,31,20,14,17,5,6,11,6,2,5,4,5,1,1,1,1,5,3,6,8,6,5,11,14,21,20,24,26,15,20,19,13,19,18,13,9,12,4,4,1,6,1,2,1,1,1,2,7,4,12,5,10,8,9,19,6,14,27,20,15,18,20,15,8,11,9,2,3,3,3,2,1,2,1,2,3,3,4,4,4,5,10,10,4,9,12,15,10,7,10,13,12,7,2,4,1,3,1,2,1,2,5,2,2,2,3,1,6,4,8,6,9,3,9,5,5,7,7,4,5,4,3,1,2,2,1,2,1,2,3,5,4,4,4,3,7,8,2,5,8,5,5,3,6,1,2,1,4,3,1,1,1,3,5,6,2,3,3,7,3,4,2,1,2,4,2,1,1,1,1,1,1,1,1,1,2,2,2,3,3,2,1,1,1,1,1,1,1,1,1,3,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],&quot;index&quot;:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340,341,342,343,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,369,370,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,423,424,425,426,427,428,429,430,431,432,433,434,435,436,437,438,439,440,441,442,443,444,445,446,447,448,449,450,451,452,453,454,455,456,457,458,459,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,495,496,497,498,499,500,501,502,503,504,505,506,507,508,509,510,511,512,513,514,515,516,517,518,519,520,521,522,523,524,525,526,527,528,529,530,531,532,533,534,535,536,537,538,539,540,541,542,543,544,545,546,547,548,549,550,551,552,553,554,555,556,557,558,559,560,561,562,563,564,565,566,567,568,569,570,571,572,573,574,575,576,577,578,579,580,581,582,583,584,585,586,587,588,589,590,591,592,593,594,595,596,597,598,599,600,601,602,603,604,605,606,607,608,609,610,611,612,613,614,615,616,617,618,619,620,621,622,623,624,625,626,627,628,629,630,631,632,633,634,635,636,637,638,639,640,641,642,643,644,645,646,647,648,649,650,651,652,653,654,655,656,657,658,659,660,661,662,663,664,665,666,667,668,669,670,671,672,673,674,675,676,677,678,679,680,681,682,683,684,685,686,687,688,689,690,691,692,693,694,695,696,697,698,699,700,701,702,703,704,705,706,707,708,709,710,711,712,713,714,715,716,717,718,719,720,721,722,723,724,725,726,727,728,729,730,731,732,733,734,735,736,737,738,739,740,741,742,743,744,745,746,747,748,749,750,751,752,753,754,755,756,757,758,759,760,761,762,763,764,765,766,767,768,769,770,771,772,773,774,775,776,777,778,779,780,781,782,783,784,785,786,787,788,789,790,791,792,793,794,795,796,797,798,799,800,801,802,803,804,805,806,807,808,809,810,811,812,813,814,815,816,817,818,819,820,821,822,823,824,825,826,827,828,829,830,831,832,833,834,835,836,837,838,839,840,841,842,843,844,845,846,847,848,849,850,851,852,853,854,855,856,857,858,859,860,861,862,863,864,865,866,867,868,869,870,871,872,873,874,875,876,877,878,879,880,881,882,883,884,885,886,887,888,889,890,891,892,893,894,895,896,897,898,899,900,901,902,903,904,905,906,907,908,909,910,911,912,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927,928,929,930,931,932,933,934,935,936,937,938,939,940,941,942,943,944,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959,960,961,962,963,964,965,966,967,968,969,970,971,972,973,974,975,976,977,978,979,980,981,982,983,984,985,986,987,988,989,990,991,992,993,994,995,996,997,998,999,1000,1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,1012,1013,1014,1015,1016,1017,1018,1019,1020,1021,1022,1023,1024,1025,1026,1027,1028,1029,1030,1031,1032,1033,1034,1035,1036,1037,1038,1039,1040,1041,1042,1043,1044,1045,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070,1071,1072,1073,1074,1075,1076,1077,1078,1079,1080,1081,1082,1083,1084,1085,1086,1087,1088,1089,1090,1091,1092,1093,1094,1095,1096,1097,1098,1099,1100,1101,1102,1103,1104,1105,1106,1107,1108,1109,1110,1111,1112,1113,1114,1115,1116,1117,1118,1119,1120,1121,1122,1123,1124,1125,1126,1127,1128,1129,1130,1131,1132,1133,1134,1135,1136,1137,1138,1139,1140,1141,1142,1143,1144,1145,1146,1147,1148,1149,1150,1151,1152,1153,1154,1155,1156,1157,1158,1159,1160,1161,1162,1163,1164,1165,1166,1167,1168,1169,1170,1171,1172,1173,1174,1175,1176,1177,1178,1179,1180,1181,1182,1183,1184,1185,1186,1187,1188,1189,1190,1191,1192,1193,1194,1195,1196,1197,1198,1199,1200,1201,1202,1203,1204,1205,1206,1207,1208,1209,1210,1211,1212,1213,1214,1215,1216,1217,1218,1219,1220,1221,1222,1223,1224,1225,1226,1227,1228,1229,1230,1231,1232,1233,1234,1235,1236,1237,1238,1239,1240,1241,1242,1243,1244,1245,1246,1247,1248,1249,1250,1251,1252,1253,1254,1255,1256,1257,1258,1259,1260,1261,1262,1263,1264,1265,1266,1267,1268,1269,1270,1271,1272,1273,1274,1275,1276,1277,1278,1279,1280,1281,1282,1283,1284,1285,1286,1287,1288,1289,1290,1291,1292,1293,1294,1295,1296,1297,1298,1299,1300,1301,1302,1303,1304,1305,1306,1307,1308,1309,1310,1311,1312,1313,1314,1315,1316,1317,1318,1319,1320,1321,1322,1323,1324,1325,1326,1327,1328,1329,1330,1331,1332,1333,1334,1335,1336,1337,1338,1339,1340,1341,1342,1343,1344,1345,1346,1347,1348,1349,1350,1351,1352,1353,1354,1355,1356,1357,1358,1359,1360,1361,1362,1363,1364,1365,1366,1367,1368,1369,1370,1371,1372,1373,1374,1375,1376,1377,1378,1379,1380,1381,1382,1383,1384,1385,1386,1387,1388,1389,1390,1391,1392,1393,1394,1395,1396,1397,1398,1399,1400,1401,1402,1403,1404,1405,1406,1407,1408,1409,1410,1411,1412,1413,1414,1415,1416,1417,1418,1419,1420,1421,1422,1423,1424,1425,1426,1427,1428,1429,1430,1431,1432,1433,1434,1435,1436,1437,1438,1439,1440,1441,1442,1443,1444,1445,1446,1447,1448,1449,1450,1451,1452,1453,1454,1455],&quot;q&quot;:[-32,-32,-27,-25,-25,-24,-24,-24,-23,-23,-23,-23,-23,-23,-23,-23,-23,-22,-22,-22,-22,-22,-22,-22,-22,-22,-22,-22,-21,-21,-21,-21,-21,-21,-21,-21,-21,-21,-20,-20,-20,-20,-20,-20,-20,-20,-20,-20,-20,-20,-20,-20,-20,-20,-20,-20,-20,-20,-19,-19,-19,-19,-19,-19,-19,-19,-19,-19,-19,-19,-19,-19,-19,-19,-19,-19,-19,-19,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-18,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-17,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-16,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-14,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-13,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-12,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-11,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-10,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-9,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-7,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-6,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,22,22,22,22,22,22,22,23,23,23,23,23,23,23,24,24,24,24,24,24,25,25,25,25,26,26,27,28,29],&quot;r&quot;:[6,23,18,10,14,6,10,12,1,5,7,8,10,14,15,17,19,2,3,5,6,7,8,9,10,11,13,14,-3,6,7,8,9,11,12,13,14,16,1,2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,22,24,26,-8,0,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,-12,-4,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,20,23,25,-6,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,-8,-7,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,24,-10,-9,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,23,-10,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,-16,-12,-11,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,-14,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,-18,-16,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,-22,-18,-14,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,29,-21,-18,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,23,25,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,-19,-17,-16,-15,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,-24,-19,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,21,22,23,-21,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,23,24,-20,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,-23,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,-21,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,-22,-21,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,16,17,18,-24,-23,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,16,-23,-21,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,15,-24,-23,-21,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,17,-23,-22,-21,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,13,15,-27,-22,-21,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,13,-24,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,-22,-21,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,-21,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,11,-22,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,-27,-22,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,7,-22,-21,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,4,5,-25,-23,-20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,5,-22,-21,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-2,-1,0,1,2,3,-24,-19,-18,-15,-14,-13,-12,-11,-10,-9,-8,-6,-5,-3,-2,-1,0,1,5,-24,-19,-18,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,0,1,-25,-21,-19,-17,-16,-15,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-2,-1,0,2,4,-18,-16,-14,-12,-9,-6,-3,-23,-17,-15,-14,-12,-7,-4,-20,-18,-16,-13,-7,-2,-21,-15,-10,-9,-11,-10,-8,-12,-15]},&quot;selected&quot;:{&quot;id&quot;:&quot;18875&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;18876&quot;}},&quot;id&quot;:&quot;18863&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18847&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18854&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;18853&quot;},&quot;ticker&quot;:null,&quot;visible&quot;:false},&quot;id&quot;:&quot;18856&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18845&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;&quot;},&quot;id&quot;:&quot;18869&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18876&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;18874&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;18874&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;18858&quot;}},&quot;id&quot;:&quot;18857&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;18863&quot;}},&quot;id&quot;:&quot;18868&quot;,&quot;type&quot;:&quot;CDSView&quot;}],&quot;root_ids&quot;:[&quot;18844&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"9a377fcc-fb40-45d2-82a8-39f0f5ecd1df","root_ids":["18844"],"roots":{"18844":"4cc1b9aa-9540-409e-a162-6f829e84cbb7"}}];
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