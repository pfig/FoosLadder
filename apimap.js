var qs = require('querystring');
var users = require("./api/users.js");
var matches = require("./api/matches.js");
var init = require("./api/init.js");

init.init();

exports.afterReady = function(callback) { init.afterReady(callback); }

var map = {
	getPlayers:users.getUsers,
	addPlayer:users.addUser,
	getPlayersByIds:users.getPlayersByIds,
	getExpectedScores:users.getExpectedScores,
	getRatingChange:users.getRatingChange,
	getMatches:matches.getMatches,
	getMatchesRaw:matches.getMatchesRaw,
	addMatch:matches.addMatch,
	rebuiltMatchStats:matches.rebuiltMatchStats,
	repeatMatchStats:matches.repeatMatchStats
	};

exports.runAPI = function(request, response)
{
	var OK;
    if (request.method == 'POST') {
        var bodystring = '';
        request.on('data', function (data) {
            bodystring += data;
        });
        request.on('end', function () {
            var body = qs.parse(bodystring);
			console.log("body: "+JSON.stringify(body));
			
			runAPIBody(body, response);
        });
    }
	else
	{
		var body = require('url').parse(request.url, true).query;
		console.log("body: "+JSON.stringify(body));
			
		runAPIBody(body, response);
	}
};

function runAPIBody(body, response)
{
	var requestkey = body.request;
	//console.log("runAPI: " + requestkey);
	var apifunction = map[requestkey];
	if(apifunction)
	{
		apifunction(body, function(data)
		{
			response.writeHeader(200, {"Content-Type": "text/plain", "Cache-control": "no-cache"});
			response.write(JSON.stringify(data)); 
			response.end();
		});
	}
	else
	{
		respondError(response, "undefined request");
	}
}

function respondError(response, message)
{
	console.log("Erorr with request. "+message);
	response.writeHeader(500, {"Content-Type": "text/plain"});  
	response.write('{"status":"error", "message":"'+message+'"}'); 
	response.end();
}

getFunctionForAPIString = function(apistring)
{
  return map[apistring];
};
