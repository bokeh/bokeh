define(['../object/forOwn'], function (forOwn) {

    /**
     * Encode object into a query string.
     */
    function encode(obj){
        var query = [];
        forOwn(obj, function(val, key){
            query.push( key +'='+ encodeURIComponent(val) );
        });
        return (query.length)? '?'+ query.join('&') : '';
    }

    return encode;
});
