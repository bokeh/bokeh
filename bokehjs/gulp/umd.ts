export const umd = (content: string) => {
  return `\
(function(root, factory) {
  if(typeof exports === 'object' && typeof module === 'object')
    module.exports = factory();
  else if(typeof define === 'function' && define.amd)
    define([], factory);
  else if(typeof exports === 'object')
    exports["Bokeh"] = factory();
  else
    root["Bokeh"] = factory();
})(this, function(define /* void 0 */) {
  return ${content};
});
`
}

export const plugin_umd = (content: string) => {
  return `\
(function(root, factory) {
  if(typeof exports === 'object' && typeof module === 'object')
    factory(require("bokeh"));
  else if(typeof define === 'function' && define.amd)
    define(["bokeh"], factory);
  else if(typeof exports === 'object')
    factory(require("Bokeh"));
  else
    factory(root["Bokeh"]);
})(this, function(Bokeh, define /* void 0 */) {
  return ${content};
});
`
}
