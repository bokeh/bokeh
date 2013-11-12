define(['../random/randInt'], function (randInt) {

    /**
     * Remove a random item from the Array and return it
     */
    function pick(arr){
        if (arr == null || !arr.length) return;
        var idx = randInt(0, arr.length - 1);
        return arr.splice(idx, 1)[0];
    }

    return pick;

});
