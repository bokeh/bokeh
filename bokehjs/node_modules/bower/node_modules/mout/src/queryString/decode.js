define(['../string/typecast', '../lang/isString'], function (typecast, isString) {

    /**
     * Decode query string into an object of keys => vals.
     */
    function decode(queryStr, shouldTypecast) {
        var queryArr = (queryStr || '').replace('?', '').split('&'),
            n = queryArr.length,
            obj = {},
            item, val;
        while (n--) {
            item = queryArr[n].split('=');
            val = shouldTypecast === false? item[1] : typecast(item[1]);
            obj[item[0]] = isString(val)? decodeURIComponent(val) : val;
        }
        return obj;
    }

    return decode;
});
