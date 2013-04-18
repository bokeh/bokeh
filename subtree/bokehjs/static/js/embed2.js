//alert("embed2.js");

console.log("embed2.js");
(function(global) {
    if(!global.Bokeh) { global.Bokeh = {}; };
    var Bokeh = global.Bokeh;

    var addPlot = function(settings) {
        console.log("settings", settings);
    };
    if(!global.addPlot){
        global.addPlot = addPlot;
    };
}(this));

