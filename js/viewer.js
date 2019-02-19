var ALLCOLOURS = {
    "Building": 0xcc0000,
    "BuildingPart": 0xcc0000,
    "BuildingInstallation": 0xcc0000,
    "Bridge": 0x999999,
    "BridgePart": 0x999999,
    "BridgeInstallation": 0x999999,
    "BridgeConstructionElement": 0x999999,
    "CityObjectGroup": 0xffffb3,
    "CityFurniture": 0xcc0000,
    "GenericCityObject": 0xcc0000,
    "LandUse": 0xffffb3,
    "PlantCover": 0x39ac39,
    "Railway": 0x000000,
    "Road": 0x999999,
    "SolitaryVegetationObject": 0x39ac39,
    "TINRelief": 0x3FD43F,
    "TransportSquare": 0x999999,
    "Tunnel": 0x999999,
    "TunnelPart": 0x999999,
    "TunnelInstallation": 0x999999,
    "WaterBody": 0x4da6ff
};
// Handle the dropped CityJSON file
function jsonGetter (url) {
"use strict"
	// uncheck wireframe checkbox
	document.getElementById("wireframeBox").checked = false;
	// start spinner
	document.getElementById("loader").style.display = "block";
	
	// Create new geometry for the new mesh
	var geom = new THREE.Geometry();

	var getjson = $.getJSON(url, function(json) {
		// Remove old geometry from scene
		while(scene.children.length > 0){ 
		    scene.remove(scene.children[0]); 
		}

		console.log("JSON file loaded.");

		// Add vertices to geometry
		for (var i = 0; i < json.vertices.length; i++) {
		geom.vertices.push( new THREE.Vector3 (
		  json.vertices[i][0],
		  json.vertices[i][1],
		  json.vertices[i][2]));
		}
		console.log("Vertices loaded.");

		var totalco = Object.keys(json.CityObjects).length;
		console.log("Total # City Objects: ", totalco);

		parseObjects(geom, json, function(){
			createmesh(geom);
			// stop spinner
			document.getElementById("loader").style.display = "none";
		});
	});
}

function parseObjects(geom, json, callback){
	for (var cityObj in json.CityObjects) {
		parseObject(geom, json, cityObj);
	}
	callback();
}

function parseObject(geom, json, cityObj){
	var coType = json.CityObjects[cityObj].type;
	for (var geomNum = 0; geomNum < json.CityObjects[cityObj].geometry.length; geomNum++) {
		if (
		(json.CityObjects[cityObj].geometry[geomNum].type == ("MultiSurface")) ||
		(json.CityObjects[cityObj].geometry[geomNum].type == ("CompositeSurface")) 
		) {
			for (var surface = 0; surface < json.CityObjects[cityObj].geometry[geomNum].boundaries.length; surface++) { 
				var lsgv = json.CityObjects[cityObj].geometry[geomNum].boundaries[surface].slice(0);
				for (var i = 0; i < lsgv.length; i++) {
					for (var j = 0; j < lsgv[i].length; j++) {
						lsgv[i][j] = {index: lsgv[i][j], vertex: json.vertices[lsgv[i][j]]};
					}
				}
				draw_one_surface(geom, lsgv, coType);
			}
		}
			
		if (json.CityObjects[cityObj].geometry[geomNum].type == "Solid") {
			for (var shell = 0; shell < json.CityObjects[cityObj].geometry[geomNum].boundaries.length; shell++) { 
				for (var surface = 0; surface < json.CityObjects[cityObj].geometry[geomNum].boundaries[shell].length; surface++) { 
					var lsgv = json.CityObjects[cityObj].geometry[geomNum].boundaries[shell][surface].slice(0);
					for (var i = 0; i < lsgv.length; i++) {
						for (var j = 0; j < lsgv[i].length; j++) {
							lsgv[i][j] = {index: lsgv[i][j], vertex: json.vertices[lsgv[i][j]]};
						}
					}
					draw_one_surface(geom, lsgv, coType);
				}
			}
		}

		if (
		(json.CityObjects[cityObj].geometry[geomNum].type == ("MultiSolid")) ||
		(json.CityObjects[cityObj].geometry[geomNum].type == ("CompositeSolid")) 
		) {
			for (var solid = 0; solid < json.CityObjects[cityObj].geometry[geomNum].boundaries.length; solid++) { 
				for (var shell = 0; shell < json.CityObjects[cityObj].geometry[geomNum].boundaries[solid].length; shell++) { 
					for (var surface = 0; surface < json.CityObjects[cityObj].geometry[geomNum].boundaries[solid][shell].length; surface++) { 
						var lsgv = json.CityObjects[cityObj].geometry[geomNum].boundaries[solid][shell][surface].slice(0);
						for (var i = 0; i < lsgv.length; i++) {
							for (var j = 0; j < lsgv[i].length; j++) {
		  						lsgv[i][j] = {index: lsgv[i][j], vertex: json.vertices[lsgv[i][j]]};
							}
						}
						draw_one_surface(geom, lsgv, coType);
					}
				}
			}
		}
	}
}

function createmesh(geom){
	// Material for mesh
	var material = new THREE.MeshBasicMaterial({
		vertexColors: THREE.VertexColors,
		flatShading: THREE.FlatShading,
		polygonOffset: true,
		polygonOffsetFactor: 1, // positive value pushes polygon further away
		polygonOffsetUnits: 1
	})

	// Add mesh to scene
	var mymesh = new THREE.Mesh(geom, material);
	mymesh.material.side = THREE.DoubleSide;
	mymesh.geometry.normalize();
	mymesh.name = "CJMesh"
	scene.add(mymesh);

	// Add wireframe
	//wireframeFunc();

	// Reposition camera	
	camera.position.set(0, 0, 2);
	camera.lookAt(0, 0, 0);

	// Render & orbit controls
	var controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.target.set(0, 0, 0);
	controls.addEventListener( 'change', function() { renderer.render(scene, camera); } ); 
	renderer.render(scene, camera);
}

//-- draw one surface (potentially with irings)
function draw_one_surface(geom, surface, cotype) {
	// console.log(surface);
	if (surface.length > 1) {
	  console.log("!!! TODO: INNER RINGS NOT DRAWN !!!");
	}
	//-- only oring
	let oring = surface[0];
	if (oring.length == 3) {
		geom.faces.push( new THREE.Face3(
		oring[0]['index'],
		oring[1]['index'],
		oring[2]['index']
		));
		var lastface = geom.faces[geom.faces.length - 1];
		lastface.color.setHex(ALLCOLOURS[cotype]);
	}
	else {
		var n = get_normal_newell(oring);
		// console.log("->", n);
		let pv = []; //-- project vertices
		for (var i = 0; i < oring.length; i++) {
			var ptmp = new THREE.Vector3(oring[i]['vertex'][0], oring[i]['vertex'][1], oring[i]['vertex'][2]);
			var re = to_2d(ptmp, n);
			// console.log("2d:", re);
			pv.push(re['x']);
			pv.push(re['y']);
		};
		// console.log("re:", pv);
		//-- triangulate with mapbox.earcut
		var tr = earcut(pv, null, 2);
		// console.log("tr:", tr);
		for (var i = 0; i < tr.length; i += 3) {
			geom.faces.push( new THREE.Face3(
			  oring[tr[i]]['index'],
			  oring[tr[i+1]]['index'],
			  oring[tr[i+2]]['index']
			));
			var lastface = geom.faces[geom.faces.length - 1];
			lastface.color.setHex(ALLCOLOURS[cotype]);
		}
	}
}

// Wireframe checkbox function
function wireframeFunc() {
	// start spinner
	document.getElementById("loader").style.display = "block";
	
	// Get the checkbox
	var checkBox = document.getElementById("wireframeBox");
	if (checkBox.checked == true){
    // Add edges
	    var currentMesh = scene.getObjectByName( "CJMesh" );
	    if(currentMesh != undefined){
			var geo = new THREE.EdgesGeometry( currentMesh.geometry ); 
			var mat = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: .1, transparent: true, opacity: 0.2 } );
		    var wireframe = new THREE.LineSegments( geo, mat );
		    wireframe.name = "wireframe"
		    scene.add( wireframe );
		    renderer.render(scene, camera);
		}
    } else { // remove edges
      	scene.remove(scene.getObjectByName("wireframe"));
      	renderer.render(scene, camera);
    };

	// end spinner
	document.getElementById("loader").style.display = "none";
};

//-- calculate normal of a set of points
function get_normal_newell(poly) {
	// find normal with Newell's method
	// console.log("poly:", poly);
	var n = [0.0, 0.0, 0.0];
	// if len(poly) == 0:
	//     print ("NOPOINTS")
	for (var i = 0; i < poly.length; i++) {
	  var nex = i + 1;
	  if ( nex == poly.length) {
	    nex = 0;
	  };
	  n[0] = n[0] + ( (poly[i]['vertex'][1] - poly[nex]['vertex'][1]) * (poly[i]['vertex'][2] + poly[nex]['vertex'][2]) );
	  n[1] = n[1] + ( (poly[i]['vertex'][2] - poly[nex]['vertex'][2]) * (poly[i]['vertex'][0] + poly[nex]['vertex'][0]) );
	  n[2] = n[2] + ( (poly[i]['vertex'][0] - poly[nex]['vertex'][0]) * (poly[i]['vertex'][1] + poly[nex]['vertex'][1]) );
		};
	var b = new THREE.Vector3(n[0], n[1], n[2]);
	return b.normalize();
};

function to_2d(p, n) {
	// n must be normalised
	// p = np.array([1, 2, 3])
	// newell = np.array([1, 3, 4.2])
	// n = newell/sqrt(p[0]*p[0] + p[1]*p[1] + p[2]*p[2])
	var x3 = new THREE.Vector3(1.1, 1.1, 1.1);
	if ( x3.distanceTo(n) < 0.01 ) {
		x3.add(new THREE.Vector3(1.0, 2.0, 3.0));
	}	    	
	var tmp = x3.dot(n);
	var tmp2 = n.clone();
	tmp2.multiplyScalar(tmp);
	x3.sub(tmp2);
	x3.normalize();
	var y3 = n.clone();
	y3.cross(x3);
	let x = p.dot(x3);
	let y = p.dot(y3);
	var re = {x: x, y: y};
	return re;
}

// Dropbox functions
var dropbox;
dropbox = document.getElementById("dropbox");
dropbox.addEventListener("dragenter", dragenter, false);
dropbox.addEventListener("dragover", dragover, false);
dropbox.addEventListener("drop", drop, false);
dropbox.addEventListener("click", click, false);

['dragover'].forEach(eventName => {
  dropbox.addEventListener(eventName, highlight, false)
});

['dragleave', 'drop'].forEach(eventName => {
  dropbox.addEventListener(eventName, unhighlight, false)
});

function highlight(e) {
  dropbox.classList.add('highlight')
}

function unhighlight(e) {
  dropbox.classList.remove('highlight')
}

function dragenter(e) {
  e.stopPropagation();
  e.preventDefault();
}

function dragover(e) {
  e.stopPropagation();
  e.preventDefault();
}

function drop(e) {
  e.stopPropagation();
  e.preventDefault();
  var dt = e.dataTransfer;
  var files = dt.files;
  handleFiles(files);
}

function click(e) {
  $('input:file')[0].click()
}

function handleFiles(files) {
	var jsonfile = files[0];
	var objectURL = window.URL.createObjectURL(jsonfile);
	jsonGetter(objectURL);
}

// Initiate scene, camera, renderer
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
    60,                                   // Field of view
    window.innerWidth/window.innerHeight, // Aspect ratio
    0.1,                                  // Near clipping pane
    10000                                 // Far clipping pane
);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor( 0xFFFFFF );
document.body.appendChild( renderer.domElement );
renderer.render(scene, camera);

window.addEventListener( 'resize', function(){
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	},
	false );