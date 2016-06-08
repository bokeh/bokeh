(function outer(modules, cache, entry) {
    function newRequire(name) {
        if (!cache[name]) {
            if (!modules[name]) {
                var err = new Error('Cannot find module \'' + name + '\'');
                err.code = 'MODULE_NOT_FOUND';
                throw err;
            }

            var m = cache[name] = {exports: {}};

            var moduleRequire = function foo(x) {
                var id = modules[name][1][x];
                return newRequire(id ? id : x);
            }
            moduleRequire.modules = newRequire.modules;

            modules[name][0].call(m.exports, moduleRequire, m, m.exports, outer, modules, cache, entry);
        }

        return cache[name].exports;
    }

    newRequire.modules = modules;

    var lastEntryResult = null;

    for (var i = 0; i < entry.length; i++) {
        lastEntryResult = newRequire(entry[i]);
    }

    return lastEntryResult;
})
