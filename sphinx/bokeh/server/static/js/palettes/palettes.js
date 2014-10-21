(function() {
  define(["./colorbrewer"], function(colorbrewer) {
    var all_palettes, items, name, num, pal;
    all_palettes = {};
    for (name in colorbrewer) {
      items = colorbrewer[name];
      for (num in items) {
        pal = items[num];
        all_palettes["" + name + "-" + num] = pal.reverse();
      }
    }
    return {
      "all_palettes": all_palettes
    };
  });

}).call(this);

/*
//@ sourceMappingURL=palettes.js.map
*/