var fs = require('fs');
var osmium = require('osmium');
var argv = require('optimist').argv;
var _ = require('underscore');
var osmfile = argv.osmfile;
var boundfile = argv.boundfile;
var path = argv.path;
var nodes = {};
var bounds;
var geojson = {
	"type": "FeatureCollection",
	"features": []
};
fs.readFile(boundfile, 'utf8', function(err, data) {
	if (err) {
		console.log('Error: ' + err);
		return;
	}
	bounds = JSON.parse(data);
	var file = new osmium.File(path + osmfile);
	var reader = new osmium.Reader(file);
	var handler = new osmium.Handler();
	console.log('Process file : ' + osmfile);
	handler.on('node', function(node) {
		var coord = [node.lon, node.lat];
		if (pointinpolygon(coord, bounds.features[0].geometry.coordinates[0])) {
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
		for (var i = 0; i < way.nodes().length; i++) {
			if (nodes.hasOwnProperty(way.nodes()[i])) {
				feature.geometry.coordinates.push(nodes[way.nodes()[i]]);
			}
		}
		if (feature.geometry.coordinates.length > 0) {
			feature.properties['osmuser'] = way.user;
			feature.properties['osmtimestamp'] = way.timestamp;
			geojson.features.push(feature);
		}
	});
	reader.apply(handler);
	var outputFilename = path + boundfile.split('.')[0] + '-' + osmfile.split('.')[0] + '.geojson';
	fs.writeFile(outputFilename, JSON.stringify(geojson), function(err) {
		if (err) {
			console.log(err);
		}
	});
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