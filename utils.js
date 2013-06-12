var crypto = require('crypto')
, _ = require('underscore');

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

var utils = {
    gen_random_str: function(num_bytes, callback) {
        'use strict';
        crypto.randomBytes(num_bytes, function(err, buf) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, buf.toString('base64'));
        });
    },
    hash: function(str) {
        return crypto.createHash('sha256').update(str).digest('hex');
    },
    hash512: function(str) {
        return crypto.createHash('sha512').update(str).digest('hex');
    },
    is_mail: function(str) {
        if ('string' !== typeof str) {return false;}
        return /^((([a-z]|\d|[\-_]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[\-_]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(str.trim());
    },
    /*
     * github.com/chriso/node-validator
     */
    has_len: function(str, min, max) {
        return ('string' === typeof str) && (str.length >= min) && (max === undefined || str.length <= max);
    },
    /*
     * github.com/chriso/node-validator
     */
    is_int: function(str) {
        var float_val, int_val;
        float_val = parseFloat(str);
        int_val = parseInt(str * 1, 10);
        if(!isNaN(int_val) && (float_val === int_val)) {return true;}
        return false;
    },
    is_number: function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },
    is_object: function(arg) {
        return ('undefined' !== typeof arg) && !!arg && ('object' === typeof arg) && !_.isArray(arg);
    },
    is_uuid: function(obj) {
        return ('string' === typeof obj) && /^[a-f0-9]{32}$/.test(obj.replace(/-/g, ''));
    },
    is_date: function(str) {
        return !isNaN(Date.parse(str));
    },
    /*
     * Returns unique array of given objects.
     */
    uniq: function(arr) {
        'use strict';
        var obj, list = {};
        if (!_.isArray(arr)) {return arr;}
        for (obj in arr) {
            if (!utils.is_object(arr[obj])) {continue;}
            list[crypto.createHash('sha256').update(JSON.stringify(arr[obj])).digest('hex')] = arr[obj];
        }
        return _.values(list);
    },
    inherit: function(source, target) {
        'use strict';
        var prop;
        if (!utils.is_object(source) ||
            !utils.is_object(target)) {
            return;
        }
        for (prop in source) {
            if (source.hasOwnProperty(prop)) {
                target[prop] = source[prop];
            }
        }
    },
    remove_undefined: function(obj) {
        var p;
        for (p in obj) {
            if (undefined === obj[p]) {
                delete obj[p];
            }
        }
        return obj;
    },
    rndstr: function(len) {
        'use strict';
        var i, which, val, str = '';
        len = (!utils.is_int(len) || (len <= 0)) ? 8 : len;
        for (i = 0; i < len; i += 1) {
            which = Math.round((Math.random()*2));
            if (0 === which) {
                val = Math.round(Math.random()*('Z'.charCodeAt(0) - 'A'.charCodeAt(0)));
                str += String.fromCharCode('A'.charCodeAt(0) + val);
            }
            if (1 === which) {
                val = Math.round(Math.random()*('z'.charCodeAt(0) - 'a'.charCodeAt(0)));
                str += String.fromCharCode('a'.charCodeAt(0) + val);
            }
            if ((2 === which) && (0 < i)) {
                str += Math.round(Math.random()*9);
            }
            if ((2 === which) && (0 === i)) {
                val = Math.round(Math.random()*('z'.charCodeAt(0) - 'a'.charCodeAt(0)));
                str += String.fromCharCode('a'.charCodeAt(0) + val);
            }
        }
        return str;
    },
    br2nl: function(str) {
        if (('string' !== typeof str) ||
            (str.length <= 0)) {return str;}
        return str.replace(/<br>/g, '\n');
    },
    nl2br: function(str) {
        if (('string' !== typeof str) ||
            (str.length <= 0)) {return str;}
        return str.replace(/\n/g, '<br>');
    },
    bytes_to_str: function(bytes) {
        'use strict';
        if (!utils.is_int(bytes)) {return bytes;}

        if (bytes < 1024) {
            return bytes + ' B';
        }
        if ((1024 <= bytes) &&
            (bytes < Math.pow(1024, 2))) {
            return (bytes/1024).toFixed(1) + ' KB';
        }
        if ((Math.pow(1024, 2) <= bytes) &&
            (bytes < Math.pow(1024, 3))) {
            return (bytes/Math.pow(1024, 2)).toFixed(1) + ' MB';
        }
        if ((Math.pow(1024, 3) <= bytes) &&
            (bytes < Math.pow(1024, 4))) {
            return (bytes/Math.pow(1024, 3)).toFixed(1) + ' GB';
        }
        return bytes;
    }
};

module.exports = utils;