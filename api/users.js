
exports.getUsers = function(body, callback)
{
    matches = GLOBAL.usersDB.view('users', 'by_name',
	function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("users.getUsers error: "+error);
			callback([]);
		}
		else
		{
			var result = [];
			for (var X in body.rows)
			{
				var user = body.rows[X].value;
				user.id = user._id;
				delete user._id;
				delete user._rev;
				result.push(user);
			}
			console.log("users.getUsers OK: " + JSON.stringify(result));
			callback(result);
		}
	});
}


exports.addUser = function(body, callback)
{
	console.log("users.addUser: "+body.name);
	GLOBAL.usersDB.insert({name: body.name}, null, function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("users.addUser error: "+error);
			callback({status:"error"});
		}
		else
		{
			console.log("users.addUser OK: " + JSON.stringify(body));
			callback({status:"OK"});
		}
	});
}

exports.updatePlayerStatsForMatch = function(matchData)
{
	console.log("users.updatePlayerStatsForMatch: "+JSON.stringify(matchData));
	var playerIds = matchData.leftPlayers.concat(matchData.rightPlayers);
	getPlayersByIdUsingIds(playerIds, function(playersById)
	{
		if(playersById == null)
		{
			console.log("FAILED TO GET PLAYER STATS TO UPDATE FOR MATCH.");
			return;
		}
		
		var OK = updateStatsOfPlayersByIdForMatch(playersById, matchData);
		if(!OK)
		{
			console.log("FAILED TO CALCULATE PLAYER STATS FOR MATCH.");
			return;
		}
		var bulk = {};
		bulk.docs = [];
		for (X in playersById)
		{
			bulk.docs.push(playersById[X]);
		}
		
		GLOBAL.usersDB.bulk(bulk, function (error, body, headers)
		{
			if(error || !body)
			{
				console.log("FAILED TO UPDATE PLAYER STATS FOR MATCH.");
			}
			else
			{
				console.log("Updated player stats for match.");
			}
		});
		
	});
	
	return;
}

function getPlayersByIdUsingIds(playerIds, callback)
{
	var playersById = {};
	GLOBAL.usersDB.fetch({keys:playerIds}, function (error, body, headers)
	{
		if(error || !body)
		{
			callback(null);
		}
		else
		{		
			for (var X in body.rows)
			{
				var row = body.rows[X];
				playersById[row.id] = row.doc;
			}
			callback(playersById);
		}
	});
}

function updateStatsOfPlayersByIdForMatch(playersById, matchData)
{
	var isDuoGame = matchData.leftPlayers >1 || matchData.rightScore > 1;
	var winners = [];
	var losers;
	if(matchData.leftScore > matchData.rightScore)
	{
		winners = matchData.leftPlayers;
		losers = matchData.rightPlayers;
	}
	else if(matchData.leftScore < matchData.rightScore)
	{
		winners = matchData.rightPlayers;
		losers = matchData.leftPlayers;
	}
	else
	{
		losers = matchData.rightPlayers.concat(matchData.leftPlayers);
	}
	var getStatsFunction = isDuoGame ? getDuoStats : getSoloStats;
	
	var X;
	var player;
	var stats;
	for (X in winners)
	{
		player = playersById[winners[X]];
		stats = getStatsFunction(player);
		addToProperty(stats, "wins", 1);
	}
	
	var everyone = winners.concat(losers);
	for (X in everyone)
	{
		player = playersById[everyone[X]];
		stats = getStatsFunction(player);
		addToProperty(stats, "games", 1);
	}
	return true;
}

function addToProperty(obj, property, value)
{
	if(!obj[property])
	{
		return obj[property] = 1;
	}
	return obj[property]++;
}

function getDuoStats(player)
{
	if(!player.duoStats)
	{
		return player.duoStats = {};
	}
	return player.duoStats;
}

function getSoloStats(player)
{
	if(!player.soloStats)
	{
		return player.soloStats = {};
	}
	return player.soloStats;
}