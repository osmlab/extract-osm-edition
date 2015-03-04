var fs = require('fs');
var osmium = require('osmium');
var argv = require('optimist').argv;
var pg = require('pg');
var _ = require('underscore');
var users = require('./users');
var osmfile = argv.osmfile;
var boundfile = argv.boundfile;
var path = argv.path;
var nodes = {};
var bounds;
var client = new pg.Client(
	"postgres://" + (argv.pguser || 'postgres') +
	":" + (argv.pgpassword || '1234') +
	"@" + (argv.pghost || 'localhost') +
	"/" + (argv.pgdatabase || 'dbextract')
);
client.connect(function(err) {
	if (err) {
		return console.error('could not connect to postgres', err);
	}
});
fs.readFile(boundfile, 'utf8', function(err, data) {
	if (err) {
		console.log('Error: ' + err);
		return;
	}
	bounds = JSON.parse(data);
	console.log(bounds);
	var file = new osmium.File(path + osmfile);
	var reader = new osmium.Reader(file);
	var handler = new osmium.Handler();

	console.log('Process file : ' + osmfile);

	handler.on('node', function(node) {
		var coord = [node.lon, node.lat];		
		if (pointinpolygon(coord, bounds.features[0].geometry.coordinates[0])) {
			//console.log(node.user);
			nodes[node.id] = coord;
		}
	});
	handler.on('way', function(way) {
		var feature = {
			"type": "Feature",
			"properties": {},
			"geometry": {
				"type": "LineString",
				"coordinates": []
			}
		};

		console.log(way.user);
		console.log(_.findIndex(users.users, {id: way.uid}));
		if (_.findIndex(users.users, {id: way.uid}) > 0) {


			console.log('=======================' + way.user + '=======================');
			// for (var i = 0; i < way.nodes().length; i++) {
			// 	if (nodes.hasOwnProperty(way.nodes()[i])) {
			// 		feature.geometry.coordinates.push(nodes[way.nodes()[i]]);
			// 	}
			// }
			// if (feature.geometry.coordinates.length > 0) {
			// 	//geojson.features.push(feature);
			// 	console.log(feature);
			// 	// client.query(query_insert, function(err, result) {
			// 	// 	if (err) {
			// 	// 		console.log("error en insertar" + err);
			// 	// 	}
			// 	// });
			// }


		}



	});
	reader.apply(handler);
});

function pointinpolygon(point, vs) {
	var x = point[0],
		y = point[1];
	var inside = false;
	for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
		var xi = vs[i][0],
			yi = vs[i][1];
		var xj = vs[j][0],
			yj = vs[j][1];
		var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}
	return inside;
}