// fetch the contents of a URL and save to a file
// We do not decode or buffer the data (stream processing)
// optionally, after all data is read
// * buffer and decode
// * run a filter function
// * write to sink stream

var fs = require("fs");
var http = require("http");

module.exports = {
    fetch: (url, filename, filter, sink) => {
	// XXX warn about wrong arity
	if (filename === undefined) { console.log("UNDEFINED!"); return; }
	console.log("Fetching ["+url+"] to ["+filename+"]");
	fs.open(filename, "w+", (err, fd) => {
	    if (err) {
		if (err.code == "ENOENT") {
		    console.log("Path doesn't exist: " + filename + "\n" + err);
		} else {
		    console.log("Could not write " + filename + ": " + err);
		}
		process.exit(1);
	    }
	    console.log("Fetching " + url + "...");
	    http.get(url, (resp) => { // error callback for ENOTFOUND?
		var data_len = 0;
		console.log("Saving " + filename);
		if (resp && resp.statusCode === 200) {
		    resp.on("data", (chunk) => {
			fs.write(fd, chunk, 0, chunk.length);
			data_len += chunk.length;
		    });
		    resp.on("end", () => {
			if (filter) {
			    var buf = new Buffer(data_len);
			    fs.read(fd, buf, 0, data_len, 0, (err, brd, buf) => {
				fs.close(fd);
				filter(sink, buf.toString("utf8"));
			    });
			} else {
			    fs.close(fd);
			}
		    });
		} else {
		    console.log("Failed to fetch " + url);
		    // process.exit(1);
		}
	    });
	});
    }
};
