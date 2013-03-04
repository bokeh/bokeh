//customizations to libraries
(function () {
_.uniqueId = function (prefix) {
    //from ipython project
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789ABCDEF";
    for (var i = 0; i < 32; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[12] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01

    var uuid = s.join("");
    if (prefix){
        return prefix + "-" + uuid;
    }else{
        return uuid;
    }
};

_.isNullOrUndefined = function(x){
    return _.isNull(x) || _.isUndefined(x);
};

_.setdefault = function(obj, key, value){
    if (_.has(obj, key)){
        return obj[key]}
    else{
        obj[key] = value
        return value
    }
};
}).call(this);
