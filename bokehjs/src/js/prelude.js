(function outer(modules, cache, entry) {
    function newRequire(name) {
        if (!cache[name]) {
            if (!modules[name]) {
                var err = new Error('Cannot find module \'' + name + '\'');
                err.code = 'MODULE_NOT_FOUND';
                throw err;
            }

            var m = cache[name] = {exports: {}};
            modules[name][0].call(m.exports, function(x) {
                var id = modules[name][1][x];
                return newRequire(id ? id : x);
            }, m, m.exports, outer, modules, cache, entry);
        }

        return cache[name].exports;
    }

    for (var i = 0; i < entry.length; i++) {
        newRequire(entry[i]);
    }

    return newRequire;
})
