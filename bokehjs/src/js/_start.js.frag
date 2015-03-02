(function (root, factory) {
  root.Bokeh = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.Bokeh;
  }
}(this, function () {
