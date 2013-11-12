(function (tree) {

tree.URL = function (val, currentFileInfo) {
    this.value = val;
    this.currentFileInfo = currentFileInfo;
};
tree.URL.prototype = {
    type: "Url",
    accept: function (visitor) {
        this.value = visitor.visit(this.value);
    },
    toCSS: function () {
        return "url(" + this.value.toCSS() + ")";
    },
    eval: function (ctx) {
        var val = this.value.eval(ctx), rootpath;

        // Add the base path if the URL is relative
        rootpath = this.currentFileInfo && this.currentFileInfo.rootpath;
        if (rootpath && typeof val.value === "string" && ctx.isPathRelative(val.value)) {
            if (!val.quote) {
                rootpath = rootpath.replace(/[\(\)'"\s]/g, function(match) { return "\\"+match; });
            }
            val.value = rootpath + val.value;
        }

        return new(tree.URL)(val, null);
    }
};

})(require('../tree'));
