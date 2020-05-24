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
    
      
      
    
      var element = document.getElementById("689e3fb0-ebe9-467e-8091-11da25352945");
        if (element == null) {
          console.warn("Bokeh: autoload.js configured with elementid '689e3fb0-ebe9-467e-8091-11da25352945' but no matching script tag was found.")
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
    
      
      var js_urls = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-widgets-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-tables-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-gl-2.0.2.min.js", "https://cdn.bokeh.org/bokeh/release/bokeh-api-2.0.2.min.js"];
      var css_urls = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.css"];
      
    
      var inline_js = [
        function(Bokeh) {
          Bokeh.set_log_level("info");
        },
        
        function(Bokeh) {
          (function(root, factory) {
              factory(root["Bokeh"]);
          })(this, function(Bokeh) {
            var define;
            return (function outer(modules, entry) {
            if (Bokeh != null) {
              return Bokeh.register_plugin(modules, entry);
            } else {
              throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
            }
          })
          ({
            "custom/main": function(require, module, exports) {
              var models = {
                "LatexLabel": require("custom/bokeh_app_96c42367e0f44215a1222c77afeac466.latex_label").LatexLabel
              };
              require("base").register_models(models);
              module.exports = models;
            },
            "custom/bokeh_app_96c42367e0f44215a1222c77afeac466.latex_label": function(require, module, exports) {
          "use strict";
          Object.defineProperty(exports, "__esModule", { value: true });
          const label_1 = require("models/annotations/label");
          class LatexLabelView extends label_1.LabelView {
              render() {
                  //--- Start of copied section from ``Label.render`` implementation
                  // Here because AngleSpec does units tranform and label doesn't support specs
                  let angle;
                  switch (this.model.angle_units) {
                      case "rad": {
                          angle = -this.model.angle;
                          break;
                      }
                      case "deg": {
                          angle = (-this.model.angle * Math.PI) / 180.0;
                          break;
                      }
                      default:
                          throw new Error("unreachable code");
                  }
                  const panel = this.panel != null ? this.panel : this.plot_view.frame;
                  const xscale = this.plot_view.frame.xscales[this.model.x_range_name];
                  const yscale = this.plot_view.frame.yscales[this.model.y_range_name];
                  let sx = this.model.x_units == "data" ? xscale.compute(this.model.x) : panel.xview.compute(this.model.x);
                  let sy = this.model.y_units == "data" ? yscale.compute(this.model.y) : panel.yview.compute(this.model.y);
                  sx += this.model.x_offset;
                  sy -= this.model.y_offset;
                  //--- End of copied section from ``Label.render`` implementation
                  // Must render as superpositioned div (not on canvas) so that KaTex
                  // css can properly style the text
                  this._css_text(this.layer.ctx, "", sx, sy, angle);
                  // ``katex`` is loaded into the global window at runtime
                  // katex.renderToString returns a html ``span`` element
                  katex.render(this.model.text, this.el, { displayMode: true });
              }
          }
          exports.LatexLabelView = LatexLabelView;
          LatexLabelView.__name__ = "LatexLabelView";
          class LatexLabel extends label_1.Label {
              constructor(attrs) {
                  super(attrs);
              }
              static init_LatexLabel() {
                  this.prototype.default_view = LatexLabelView;
              }
          }
          exports.LatexLabel = LatexLabel;
          LatexLabel.__name__ = "LatexLabel";
          LatexLabel.init_LatexLabel();
          //# sourceMappingURL=extensions_example_latex.py:LatexLabel.js.map
          }
          }, "custom/main");
          ;
          });
    
        },
        
        function(Bokeh) {
          (function() {
            var fn = function() {
              Bokeh.safely(function() {
                (function(root) {
                  function embed_document(root) {
                    
                  var docs_json = '{&quot;7940fce1-37fb-440f-bf9e-ac654421ae92&quot;:{&quot;roots&quot;:{&quot;references&quot;:[{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20071&quot;,&quot;type&quot;:&quot;SaveTool&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;20089&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;20065&quot;}},&quot;id&quot;:&quot;20064&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20072&quot;,&quot;type&quot;:&quot;ResetTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20058&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20068&quot;,&quot;type&quot;:&quot;PanTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20094&quot;,&quot;type&quot;:&quot;Selection&quot;},{&quot;attributes&quot;:{&quot;line_alpha&quot;:0.1,&quot;line_color&quot;:&quot;#1f77b4&quot;,&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;20084&quot;,&quot;type&quot;:&quot;Line&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;20060&quot;},&quot;ticker&quot;:null},&quot;id&quot;:&quot;20063&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;data_source&quot;:{&quot;id&quot;:&quot;20082&quot;},&quot;glyph&quot;:{&quot;id&quot;:&quot;20083&quot;},&quot;hover_glyph&quot;:null,&quot;muted_glyph&quot;:null,&quot;nonselection_glyph&quot;:{&quot;id&quot;:&quot;20084&quot;},&quot;selection_glyph&quot;:null,&quot;view&quot;:{&quot;id&quot;:&quot;20086&quot;}},&quot;id&quot;:&quot;20085&quot;,&quot;type&quot;:&quot;GlyphRenderer&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20073&quot;,&quot;type&quot;:&quot;HelpTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20052&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{&quot;overlay&quot;:{&quot;id&quot;:&quot;20074&quot;}},&quot;id&quot;:&quot;20070&quot;,&quot;type&quot;:&quot;BoxZoomTool&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20069&quot;,&quot;type&quot;:&quot;WheelZoomTool&quot;},{&quot;attributes&quot;:{&quot;formatter&quot;:{&quot;id&quot;:&quot;20091&quot;},&quot;ticker&quot;:{&quot;id&quot;:&quot;20061&quot;}},&quot;id&quot;:&quot;20060&quot;,&quot;type&quot;:&quot;LinearAxis&quot;},{&quot;attributes&quot;:{&quot;data&quot;:{&quot;x&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAAAAB7FK5H4XqEP3sUrkfhepQ/uB6F61G4nj97FK5H4XqkP5qZmZmZmak/uB6F61G4rj/sUbgeheuxP3sUrkfherQ/CtejcD0Ktz+amZmZmZm5Pylcj8L1KLw/uB6F61G4vj+kcD0K16PAP+xRuB6F68E/MzMzMzMzwz97FK5H4XrEP8P1KFyPwsU/CtejcD0Kxz9SuB6F61HIP5qZmZmZmck/4XoUrkfhyj8pXI/C9SjMP3E9CtejcM0/uB6F61G4zj8AAAAAAADQP6RwPQrXo9A/SOF6FK5H0T/sUbgehevRP4/C9Shcj9I/MzMzMzMz0z/Xo3A9CtfTP3sUrkfhetQ/H4XrUbge1T/D9Shcj8LVP2dmZmZmZtY/CtejcD0K1z+uR+F6FK7XP1K4HoXrUdg/9ihcj8L12D+amZmZmZnZPz4K16NwPdo/4XoUrkfh2j+F61G4HoXbPylcj8L1KNw/zczMzMzM3D9xPQrXo3DdPxWuR+F6FN4/uB6F61G43j9cj8L1KFzfPwAAAAAAAOA/UrgehetR4D+kcD0K16PgP/YoXI/C9eA/SOF6FK5H4T+amZmZmZnhP+xRuB6F6+E/PgrXo3A94j+PwvUoXI/iP+F6FK5H4eI/MzMzMzMz4z+F61G4HoXjP9ejcD0K1+M/KVyPwvUo5D97FK5H4XrkP83MzMzMzOQ/H4XrUbge5T9xPQrXo3DlP8P1KFyPwuU/Fa5H4XoU5j9nZmZmZmbmP7gehetRuOY/CtejcD0K5z9cj8L1KFznP65H4XoUruc/AAAAAAAA6D9SuB6F61HoP6RwPQrXo+g/9ihcj8L16D9I4XoUrkfpP5qZmZmZmek/7FG4HoXr6T8+CtejcD3qP5DC9Shcj+o/4XoUrkfh6j8zMzMzMzPrP4XrUbgehes/16NwPQrX6z8pXI/C9SjsP3sUrkfheuw/zczMzMzM7D8fhetRuB7tP3E9CtejcO0/w/UoXI/C7T8VrkfhehTuP2dmZmZmZu4/uB6F61G47j8K16NwPQrvP1yPwvUoXO8/rkfhehSu7z8AAAAAAADwPw==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[101]},&quot;y&quot;:{&quot;__ndarray__&quot;:&quot;AAAAAAAACEBBNiDV2e8HQLgHRIeovwdAudZ7py5wB0AWcKATrQIHQCr95ebdeAZABq70gO3UBUBvQK2/cRkFQNQKBo9fSQRANLAk+f5nA0Aq/eXm3XgCQKg3UMbBfwFAnATfUJiAAEDI9kFez/7+P7CQX3N8AP0/rAU0MkQO+z+Zn7YNAjD5P1bq8+FAbfc/In+lgBzN9T/2oxb+JFb0P6wFNDJEDvM/1B+/2KX68T+OUgixoh/xP5Dwd/GugPA/f5O/VUwg8D8AAAAAAADwP36Tv1VMIPA/kPB38a6A8D+OUgixoh/xP9Mfv9il+vE/rAU0MkQO8z/1oxb+JFb0PyN/pYAczfU/Werz4UBt9z+bn7YNAjD5P6wFNDJEDvs/sZBfc3wA/T/J9kFez/7+P5sE31CYgABApzdQxsF/AUAq/eXm3XgCQDOwJPn+ZwNA0woGj19JBEBuQK2/cRkFQAWu9IDt1AVAKv3l5t14BkAWcKATrQIHQLnWe6cucAdAuAdEh6i/B0BANiDV2e8HQAAAAAAAAAhAQTYg1dnvB0C4B0SHqL8HQLnWe6cucAdAFnCgE60CB0Ap/eXm3XgGQASu9IDt1AVAb0Ctv3EZBUDVCgaPX0kEQDSwJPn+ZwNAK/3l5t14AkCoN1DGwX8BQJwE31CYgABAy/ZBXs/+/j+vkF9zfAD9P64FNDJEDvs/lp+2DQIw+T9Y6vPhQG33Px5/pYAczfU/9KMW/iRW9D+tBTQyRA7zP9Yfv9il+vE/jlIIsaIf8T+Q8HfxroDwP36Tv1VMIPA/AAAAAAAA8D9+k79VTCDwP5Dwd/GugPA/jFIIsaIf8T/UH7/YpfrxP6sFNDJEDvM/+KMW/iRW9D8if6WAHM31P1zq8+FAbfc/k5+2DQIw+T+qBTQyRA77P6yQX3N8AP0/yPZBXs/+/j+aBN9QmIAAQKg3UMbBfwFAKf3l5t14AkA1sCT5/mcDQNQKBo9fSQRAcECtv3EZBUAGrvSA7dQFQCn95ebdeAZAFXCgE60CB0C51nunLnAHQLgHRIeovwdAQTYg1dnvB0AAAAAAAAAIQA==&quot;,&quot;dtype&quot;:&quot;float64&quot;,&quot;shape&quot;:[101]}},&quot;selected&quot;:{&quot;id&quot;:&quot;20094&quot;},&quot;selection_policy&quot;:{&quot;id&quot;:&quot;20095&quot;}},&quot;id&quot;:&quot;20082&quot;,&quot;type&quot;:&quot;ColumnDataSource&quot;},{&quot;attributes&quot;:{&quot;line_color&quot;:&quot;#1f77b4&quot;,&quot;x&quot;:{&quot;field&quot;:&quot;x&quot;},&quot;y&quot;:{&quot;field&quot;:&quot;y&quot;}},&quot;id&quot;:&quot;20083&quot;,&quot;type&quot;:&quot;Line&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20095&quot;,&quot;type&quot;:&quot;UnionRenderers&quot;},{&quot;attributes&quot;:{&quot;background_fill_alpha&quot;:0,&quot;render_mode&quot;:&quot;css&quot;,&quot;text&quot;:&quot;f = \\\\sum_{n=1}^\\\\infty\\\\frac{-e^{i\\\\pi}}{2^n}!&quot;,&quot;text_font_size&quot;:&quot;21px&quot;,&quot;x&quot;:40,&quot;x_units&quot;:&quot;screen&quot;,&quot;y&quot;:420,&quot;y_units&quot;:&quot;screen&quot;},&quot;id&quot;:&quot;20087&quot;,&quot;type&quot;:&quot;LatexLabel&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20054&quot;,&quot;type&quot;:&quot;DataRange1d&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20065&quot;,&quot;type&quot;:&quot;BasicTicker&quot;},{&quot;attributes&quot;:{&quot;bottom_units&quot;:&quot;screen&quot;,&quot;fill_alpha&quot;:0.5,&quot;fill_color&quot;:&quot;lightgrey&quot;,&quot;left_units&quot;:&quot;screen&quot;,&quot;level&quot;:&quot;overlay&quot;,&quot;line_alpha&quot;:1.0,&quot;line_color&quot;:&quot;black&quot;,&quot;line_dash&quot;:[4,4],&quot;line_width&quot;:2,&quot;right_units&quot;:&quot;screen&quot;,&quot;top_units&quot;:&quot;screen&quot;},&quot;id&quot;:&quot;20074&quot;,&quot;type&quot;:&quot;BoxAnnotation&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20089&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{&quot;axis&quot;:{&quot;id&quot;:&quot;20064&quot;},&quot;dimension&quot;:1,&quot;ticker&quot;:null},&quot;id&quot;:&quot;20067&quot;,&quot;type&quot;:&quot;Grid&quot;},{&quot;attributes&quot;:{&quot;source&quot;:{&quot;id&quot;:&quot;20082&quot;}},&quot;id&quot;:&quot;20086&quot;,&quot;type&quot;:&quot;CDSView&quot;},{&quot;attributes&quot;:{&quot;below&quot;:[{&quot;id&quot;:&quot;20060&quot;}],&quot;center&quot;:[{&quot;id&quot;:&quot;20063&quot;},{&quot;id&quot;:&quot;20067&quot;},{&quot;id&quot;:&quot;20087&quot;}],&quot;left&quot;:[{&quot;id&quot;:&quot;20064&quot;}],&quot;plot_height&quot;:500,&quot;plot_width&quot;:500,&quot;renderers&quot;:[{&quot;id&quot;:&quot;20085&quot;}],&quot;title&quot;:{&quot;id&quot;:&quot;20050&quot;},&quot;toolbar&quot;:{&quot;id&quot;:&quot;20075&quot;},&quot;x_range&quot;:{&quot;id&quot;:&quot;20052&quot;},&quot;x_scale&quot;:{&quot;id&quot;:&quot;20056&quot;},&quot;y_range&quot;:{&quot;id&quot;:&quot;20054&quot;},&quot;y_scale&quot;:{&quot;id&quot;:&quot;20058&quot;}},&quot;id&quot;:&quot;20049&quot;,&quot;subtype&quot;:&quot;Figure&quot;,&quot;type&quot;:&quot;Plot&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20091&quot;,&quot;type&quot;:&quot;BasicTickFormatter&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20056&quot;,&quot;type&quot;:&quot;LinearScale&quot;},{&quot;attributes&quot;:{&quot;active_drag&quot;:&quot;auto&quot;,&quot;active_inspect&quot;:&quot;auto&quot;,&quot;active_multi&quot;:null,&quot;active_scroll&quot;:&quot;auto&quot;,&quot;active_tap&quot;:&quot;auto&quot;,&quot;tools&quot;:[{&quot;id&quot;:&quot;20068&quot;},{&quot;id&quot;:&quot;20069&quot;},{&quot;id&quot;:&quot;20070&quot;},{&quot;id&quot;:&quot;20071&quot;},{&quot;id&quot;:&quot;20072&quot;},{&quot;id&quot;:&quot;20073&quot;}]},&quot;id&quot;:&quot;20075&quot;,&quot;type&quot;:&quot;Toolbar&quot;},{&quot;attributes&quot;:{&quot;text&quot;:&quot;LaTex Demonstration&quot;},&quot;id&quot;:&quot;20050&quot;,&quot;type&quot;:&quot;Title&quot;},{&quot;attributes&quot;:{},&quot;id&quot;:&quot;20061&quot;,&quot;type&quot;:&quot;BasicTicker&quot;}],&quot;root_ids&quot;:[&quot;20049&quot;]},&quot;title&quot;:&quot;Bokeh Application&quot;,&quot;version&quot;:&quot;2.0.2-56-gdbf9ca4c6&quot;}}';
                  var render_items = [{"docid":"7940fce1-37fb-440f-bf9e-ac654421ae92","root_ids":["20049"],"roots":{"20049":"689e3fb0-ebe9-467e-8091-11da25352945"}}];
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