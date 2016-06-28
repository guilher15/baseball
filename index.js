const http = require("http");
const fs = require("fs");
const __ = require("lodash");
var cheerio = require("cheerio");
const fetch = require("./fetch");

// Singleton configuration object
// XXX race condition if used before initialized
var z;
fs.readFile("config.json", "utf8", (e, d) => {
    if (e) throw e;
    z = JSON.parse(d);
    console.log(z);
});

var html_to_json = (res, d) => {
    res.writeHead(200, {"Content-Type": "text/json"});
    var $ = cheerio.load(d);
    var img = $("img");
    var urls = __.map(img, 'attribs.src').filter((e)=>e !== undefined).filter((e) => e.substr(-3, 3) == "jpg");
    var names = __.map($(z.selector), "children[0].data").filter((e) => e.length>1);
    var raw_player_names = __.map($(z.selector), "children[0].next.children[0].data");
    var player_names = [];
    for (var i=1; i < raw_player_names.length; ++i) {
	player_names.push(raw_player_names[i]);
	while (i < raw_player_names.length && raw_player_names[i] !== undefined) {
	    ++i;
	}
    }
    var filenames = [];
    var url;
    while (url = urls.shift()) {
	filenames.push("/img/" + url.split("/").pop());
    }
    res.end(JSON.stringify({"urls": filenames, "names": names, "players": player_names}));
};

http.createServer((req, res) => {
    var path = req.url.substr(1);
    console.log("[" + path + "]");
    var match;
    if (path === undefined || path === "undefined") {
	console.log("Problem with request [" + req.url + "]");
	res.writeHead(404, {});
	res.end();
    } else if (path === "") {
	fs.readFile("index.html", "utf8", function (e, d) {
	    res.writeHead(200, {"Content-Type": "text/html"});
	    res.end(d);
	});
    } else if (match = path.match(/^img\/(\d{6}\.jpg)$/)) {
	console.log("Request for ["+match[0]+"]");
	fs.readFile(match[0], function (e, d) {
	    if (e) {
		console.log(JSON.stringify(e));
		if (e.code === "ENOENT") {
		    console.log("There was no file, so we're jumping into fetch");
		    fetch.fetch(z.url_host+z.url_path+match[1], match[0],
				(s, d) => {
				    s.writeHead(200, {"Content-Type": "image/jpeg"});
				    s.end(d); // XXX is this being utf8 decoded?
				}, res);
		} else {
		    console.log(e);
		    res.writeHead(404, {});
		    res.end();
		}
	    } else {
		console.log(" Found local file ["+path+"]");
		res.writeHead(200, {"Content-Type": "image/jpg"});
		res.end(d);
	    }
	});
    } else if (match = path.match(/^[a-z]{2,3}$/)) {
	var datafile = "teams/" + match[0] + "/" + match[0] + ".html";
	//console.log(datafile);
	fs.readFile(datafile, "utf8", function (e, d) {
	    if (e) {
		if (e.code === "ENOENT") {
		    res.writeHead(200, {"Content-Type": "text/json"}); // optimistic
		    fetch.fetch(z.url_base + match[0], datafile, html_to_json, res);
		} else {
		    console.log(e);
		    res.writeHead(404, {});
		    res.end();
		}
	    } else {
		html_to_json(res, d);
	    }
	});
    } else {
	console.log("Bad request: ["+ path +"]");
	res.writeHead(404, {});
	res.end();
    }
}).listen(8124);
