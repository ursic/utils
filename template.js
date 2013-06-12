var fs = require('fs')
, _ = require('underscore');

/*
 * Find and return locations of needle in given haystack.
 */
function find_locs(needle, haystack) {
    'use strict';
    var curr_loc, loc, locs;
    curr_loc = 0;
    locs = [];
    while(true) {
        loc = haystack.indexOf(needle, curr_loc);
        if (-1 === loc) {return locs;}
        locs.push(loc);
        curr_loc = loc + needle.length;
    }
}

/*
 * String replacer for HTML templating
 * 
 * Usage example:
 *
 * function fill_template(t) {
 *     Insert datum.
 *     t.insert('TITLE', 'Article title')
 * 
 *     Insert repeater.
 *     t.insert('ARTICLE')
 * }
 * 
 * var template = require(__dirname + '/template');
 * var t = Object.create(template);
 * t.init('template.html', fill_template);
 * 
 * Write to file.
 * t.write(<SAVE_TO_PATH>)
 * 
 * Get template string.
 * t.get()
 *
 */
var Template = {
    t: null,
    brace: '##',
    rep_start: null,
    rep_end: null,
    repeaters: {},
    // Find and return repeaters from haystack.
    extract_reps: function(haystack) {
        'use strict';
        var locs, rep, min_pos, i, m, start_pos, start, name, end, reps = {};
        locs = find_locs(this.rep_start, haystack);
        for(var j = 0; j < locs.length; j += 1) {
            rep = locs[j];
            min_pos = rep - 1;
            i = 1;
            m = null;
            while (this.brace !== m) {
                //  Find its beginning.
                m = haystack.slice(min_pos - (i + this.brace.length), min_pos - i);
                i += 1;
            }
            //  Extract its name.
            start_pos = rep - (i + this.brace.length);
            start = haystack.slice(start_pos, rep) + this.rep_start;
            name = start.slice(this.brace.length, start.length - this.rep_start.length);
            end = this.brace + name + this.rep_end;
            //  Look for matching end tag.
            if (-1 === haystack.indexOf(end)) {continue;}
            // Extract its content.
            reps[name] = haystack.slice(start_pos, haystack.indexOf(end) + end.length);
        }
        return reps;
    },
    remove_tags: function(haystack) {
	return haystack.replace(new RegExp(this.brace + '[a-z0-9_\-]+' + this.brace, 'ig'), '');
    },
    // Remove repeaters from haystack and return it.
    remove_reps: function(haystack) {
	'use strict';
	var reps = this.extract_reps(haystack);
	for(var rep in reps) {
            haystack = haystack.replace(reps[rep], '');
	}
	return haystack;
    },
    set_repeaters: function() {
	'use strict';
	this.rep_start = '_START' + this.brace;
	this.rep_end = '_END' + this.brace;
	this.repeaters = this.extract_reps(this.t);
    },
    insert: function(tag_name, replacement) {
        'use strict';
        var tag, start, end, start_pos, end_pos, content;
        // Replace all occurrences of given tag.
        if ((('undefined' !== typeof replacement) &&
             !_.contains(_.keys(this.repeaters), tag_name))) {
	    tag = this.brace + tag_name + this.brace;
            this.t = this.t.replace(new RegExp(tag, 'g'), '' + replacement);
        } else if (this.repeaters.hasOwnProperty(tag_name)) {
            // Fill blank repeater.
            // Insert filled block into the template.
            // Append blank repeater at the end of insertion.
            start = this.brace + tag_name + this.rep_start;
            end = this.brace + tag_name + this.rep_end;
            start_pos = this.t.indexOf(start) + start.length;
            end_pos = this.t.indexOf(end);

            // Replace replacement with repeater if provided.
            if ('string' === typeof replacement) {
	        tag = this.brace + replacement + this.brace;
                this.t = this.t.replace(new RegExp(tag, 'g'), this.remove_reps(this.t.slice(start_pos, end_pos)) + tag);
                // The repeater block might have moved. Recalculate its position.
                start_pos = this.t.indexOf(start) + start.length;
                end_pos = this.t.indexOf(end);
                start_pos -= start.length;
                end_pos += end.length;
                this.t = this.t.slice(0, start_pos) + this.repeaters[tag_name] + this.t.slice(end_pos);
                return;
            }

            content = this.remove_reps(this.t.slice(start_pos, end_pos)) + this.repeaters[tag_name];
            start_pos -= start.length;
            end_pos += end.length;
            this.t = this.t.slice(0, start_pos) + content + this.t.slice(end_pos);
        }

    },
    /*
     * Return HTML string tags included when dirty is true.
     * Otherwise return clean version.
     */
    get: function(dirty) {
	'use strict';
	if (dirty) {return this.t;}
	return this.remove_tags(this.remove_reps(this.t));	    
    },
    write: function(filename) {
        'use strict';
        var that = this;
        fs.open(filename, 'r', function(err, fd) {
            if (err) {
		return;
            }
	    fs.write(fd, that.remove_reps(that.t), 0, that.t.length, null, function() {
		fs.close(fd);
	    });
	});
    },
    init: function(path_or_str, callback, brace) {
        'use strict';
        var that = this;
        if ('undefined' === typeof(path_or_str)) {
            callback('error');
	    return;
	}

        if ('undefined' !== typeof(brace)) {this.brace = brace;}

        fs.stat(path_or_str, function(err, stat) {
            'use strict';
            if(err) {
		that.t = path_or_str;
		that.set_repeaters();
		callback(that);
            } else {
		if (!stat.isFile()) {
		    return;
		}
		fs.open(path_or_str, 'r', function(err, fd) {
		    fs.read(fd, new Buffer(stat.size), 0, stat.size, 0, function(err, bytesRead, buffer) {
			fs.close(fd);
			that.t = buffer.toString();
			that.set_repeaters();
			callback(that);
		    });
		});
            }
	});
    }
};

var Funcs = {
    init: function(path_or_str, callback) {
	Object.create(Template).init(path_or_str, callback);
    },
    get_html_part: function(path_or_str, callback) {
	Funcs.init(path_or_str, function(t) {
	    callback(null, t.get(true));
	});
    }
};

module.exports = {
    template: Template,
    funcs: Funcs
};