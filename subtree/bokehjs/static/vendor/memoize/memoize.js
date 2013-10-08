/*
 * memoize.js
 * by @philogb and @addyosmani
 * with further optimizations by @mathias
 * and @DmitryBaranovsk
 * perf tests: http://bit.ly/q3zpG3
 * Released under an MIT license.
 */
function memoize( fn ) {
    return function () {
        var args = Array.prototype.slice.call(arguments),
        hash = "",
        i = args.length;
        currentArg = null;
        while (i--) {
            currentArg = args[i];
            hash += (currentArg === Object(currentArg)) ?
                JSON.stringify(currentArg) : currentArg;
            fn.memoize || (fn.memoize = {});
        }
        return (hash in fn.memoize) ? fn.memoize[hash] :
            fn.memoize[hash] = fn.apply(this, args);
    };
}

/*
function memoize(f){
    var cache = {};
    cache['hits'] = 0
    cache['misses'] = 0
    return function(){

        var key = JSON.stringify(Array.prototype.slice.call(arguments));

        if(key in cache){
            cache['hits'] += 1
            console.log('From cache...', cache['hits'], cache['misses']);
            return cache[key]
        }else{
            cache['misses'] +=1
            console.log('Computing..', cache['hits'], cache['misses']);
            return cache[key] = f.apply(this,arguments);
        }

    }

}
*/
