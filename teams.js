var fs = require("fs");
var fetch = require("./fetch");

var team = process.argv[2];
var team_file = "teams/" + team + "/" + team + ".html";

console.log("Fetching "+team_file);
fs.readFile("config.json", "utf8", (e, d) => {
    if (e) throw e;
    z = JSON.parse(d);
    fs.stat(team_file, (e) => {
	if (e) {
	    fetch.fetch(z.url_base + team, team_file);
	}
    });
});
