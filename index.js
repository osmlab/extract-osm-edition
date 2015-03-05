var fs = require('fs');
var osmium = require('osmium');
var argv = require('optimist').argv;
var _ = require('underscore');
var osmfile = argv.osmfile;
var nodes = {};
var bounds;
var geojson = {
	"type": "FeatureCollection",
	"features": []
};
var file = new osmium.File(osmfile);
var reader = new osmium.Reader(file);
var handler = new osmium.Handler();
handler.on('node', function(node) {
	var coord = [node.lon, node.lat];
	nodes[node.id] = coord;
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
var outputFilename = osmfile.split('.')[0] + '.geojson';
fs.writeFile(outputFilename, JSON.stringify(geojson), function(err) {
	if (err) {
		console.log(err);
	}
});