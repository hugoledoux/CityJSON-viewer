var boolDrag = false

//JSON variables
var jsonDict = {} //contains the json datas
var boolJSONload = false //checks if jsondata is loaded
var meshes = [] //contains the meshes of the objects
var geoms = {} //contains the geometries of the objects
//create empty array that contains all the meshes

//Camera variables
var scene
var camera
var renderer
var raycaster
var mouse
var controls
var spot_light

// called at document loading and creates the button functions
function initDocument() {

  $("#viewer").mousedown(function(eventData) {
    if (eventData.button == 0) { //leftClick
      getAttributes(eventData)
    }
  });

  $("#dragger").mousedown(function() {
    boolDrag = true;
  });

  $(document).mouseup(function() {
    boolDrag = false
  });

  $(document).mousemove(function(event) {
    if (boolDrag == false) {
      return
    }
    var xPosition = event.pageX;
    var screenWidth = $(window).width();

    if (xPosition > 250 && xPosition < screenWidth * 0.8) {
      $("#pageHelper").width(xPosition)
      $("#dropbox").width(xPosition - 50)
    }
  });

  $(window).resize(function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

  });


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
}

//called at document load and create the viewer functions
function initViewer() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    60, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.001, // Near clipping pane
    10000 // Far clipping pane
  );

  //renderer for three.js
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  document.getElementById("viewer").appendChild(renderer.domElement);
  renderer.setSize($("#viewer").width(), $("#viewer").height());
  renderer.setClearColor(0xFFFFFF);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // add raycaster and mouse (for clickable objects)
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2();

  //add AmbientLight (light that is only there that there's a minimum of light and you can see color)
  //kind of the natural daylight
  var am_light = new THREE.AmbientLight(0xFFFFFF, 0.7); // soft white light
  scene.add(am_light);

  // Add directional light
  var spot_light = new THREE.SpotLight(0xDDDDDD);
  spot_light.position.set(84616, -1, 447422);
  spot_light.target = scene;
  spot_light.castShadow = true;
  spot_light.intensity = 0.4
  spot_light.position.normalize()
  scene.add(spot_light);

  //Helpers
  /*
  var spotLightHelper = new THREE.SpotLightHelper( spot_light );
  scene.add( spotLightHelper );

  var helper = new THREE.CameraHelper( spot_light.shadow.camera );
  scene.add( helper );

  var axesHelper = new THREE.AxesHelper( 5 );
  scene.add( axesHelper );
  */

  //render & orbit controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', function() {
    renderer.render(scene, camera);
  });

  //render before loading so that window is not black
  renderer.render(scene, camera);

}

//executed when files are uploaded
async function handleFiles(files) {

  // uncheck wireframe checkbox
  document.getElementById("wireframeBox").checked = false;
  toggleWireframe()

  boolJSONload = false;

  //if no files are there
  if (files[0] == null) {
    return
  }

  //start spinner
  $("#loader").show();

  for (var i = 0; i < files.length; i++) {
    //if file is not json
    var split_file_name = files[i].name.split(".");
    if (split_file_name[split_file_name.length - 1] != "json") {
      alert("file '" + files[i].name + "' is not a json file");
      continue
    }

    //if file already exist
    if (files[i].name.split(".")[0] in jsonDict) {
      alert("file '" + files[i].name + "' already loaded!");
      continue
    }

    //load json into memory
    var objectURL = window.URL.createObjectURL(files[i])
    var json = await loadJSON(objectURL)
    var jsonName = files[i].name.split(".")[0]

    //json file has an error and cannot be loaded
    if (json == -1){
      window.alert("File " + jsonName + ".json has an error and cannot be loaded!")
      continue
    }

    //add json to the dict
    jsonDict[jsonName] = json;

    //add it to the infoBox
    $("#filesBox").show();
    $('#TreeView').append('<li id="li_' + jsonName + '">' +
      '<span onclick="toggleTree(this);" id="span_' + jsonName + '">▽</span>' +
      '<input type="checkbox" onclick="toggleFile(this);" id="checkFile_' + jsonName + '" checked>' +
      '<span class="spanLiFileName">' + jsonName + '</span>' +
      '<ul class="fileTree" id="ul_' + jsonName + '"></ul>' +
      '</li>')

    //load the cityObjects into the viewer
    await loadCityObjects(jsonName)

    //already render loaded objects
    renderer.render(scene, camera);
    console.log("JSON file '" + jsonName + "' loaded")

  }

  //hide loader when loadin is finished
  $("#loader").hide();

  //global variable that a json is loaded
  boolJSONload = true

  //reset the input
  $("#fileElem").val("")

}

//load JSONfile into memory
async function loadJSON(url) {

  //temp variable to get the data out of getJSON
  var _data

  try {
    //load json
    var getjson = await $.getJSON(url, function(data) {
      _data = data
    });
  } catch (e) {
    return(-1)
  }

  return (_data);
}

//convert CityObjects to mesh and add them to the viewer
async function loadCityObjects(jsonName) {

  var json = jsonDict[jsonName]

  console.log("TODO: REMOVE NORMGEOM");
  //create one geometry that contains all vertices (in normalized form)
  //normalize must be done for all coordinates as otherwise the objects are at same pos and have the same size
  var normGeom = new THREE.Geometry()
  for (var i = 0; i < json.vertices.length; i++) {
    var point = new THREE.Vector3(
      json.vertices[i][0],
      json.vertices[i][1],
      json.vertices[i][2]
    );
    normGeom.vertices.push(point)
  }
  normGeom.normalize()

  for (var i = 0; i < json.vertices.length; i++) {
    json.vertices[i][0] = normGeom.vertices[i].x;
    json.vertices[i][1] = normGeom.vertices[i].y;
    json.vertices[i][2] = normGeom.vertices[i].z;
  }

  var stats = getStats(json.vertices)
  var minX = stats[0]
  var minY = stats[1]
  var minZ = stats[2]
  var avgX = stats[3]
  var avgY = stats[4]
  var avgZ = stats[5]

  camera.position.set(0, 0, 2);
  camera.lookAt(avgX, avgY, avgZ);

  controls.target.set(avgX,
    avgY,
    avgZ);

  //enable movement parallel to ground
  controls.screenSpacePanning = true;


  //count number of objects
  var totalco = Object.keys(json.CityObjects).length;
  console.log("Total # City Objects: ", totalco);

  //create dictionary
  var children = {}

  //iterate through all cityObjects
  for (var cityObj in json.CityObjects) {

    try {
      //parse cityObj that it can be displayed in three js
      var returnChildren = await parseObject(cityObj, jsonName)

      //if object has children add them to the childrendict
      for (var i in returnChildren) {
        children[jsonName + '_' + returnChildren[i]] = cityObj
      }

    } catch (e) {
      console.log("ERROR at creating: " + cityObj);
      continue
    }


    var appendix = $('#ul_' + jsonName)
    if (jsonName + '_' + cityObj in children) {
      appendix = $('#ul_' + jsonName + '_' + children[jsonName + '_' + cityObj])
      delete children[jsonName + '_' + cityObj]
    }

    appendix.append('<li><input type="checkbox" onclick="toggleMesh(this);" id="check_' + cityObj + '" checked>' + cityObj + '</li>');

    //if object has children
    if (returnChildren != "") {
      //change toggleMesh to toggleParent
      $("#check_" + cityObj).attr("onclick", "toggleParent(this)");
      appendix.append('<ul class="objectTree" id="ul_' + jsonName + '_' + cityObj + '"></ul>');
      continue
    }

    //set color of object
    var coType = json.CityObjects[cityObj].type;
    var material = new THREE.MeshLambertMaterial();
    material.color.setHex(ALLCOLOURS[coType]);

    //create mesh
    //geoms[cityObj].normalize()
    var _id = jsonName + "_" + cityObj
    var coMesh = new THREE.Mesh(geoms[_id], material)
    coMesh.name = cityObj;
    coMesh.jsonName = jsonName
    coMesh.castShadow = true;
    coMesh.receiveShadow = true;
    scene.add(coMesh);
    meshes.push(coMesh);
  }
}

//convert json file to viwer-object
async function parseObject(cityObj, jsonName) {

  var json = jsonDict[jsonName]

  if (json.CityObjects[cityObj].children != undefined) {
    return (json.CityObjects[cityObj].children)
  };

  //create geometry and empty list for the vertices
  var geom = new THREE.Geometry()

  //each geometrytype must be handled different
  var geomType = json.CityObjects[cityObj].geometry[0].type
  if (geomType == "Solid") {
    boundaries = json.CityObjects[cityObj].geometry[0].boundaries[0];
  } else if (geomType == "MultiSurface" || geomType == "CompositeSurface") {
    boundaries = json.CityObjects[cityObj].geometry[0].boundaries;
  } else if (geomType == "MultiSolid" || geomType == "CompositeSolid") {
    boundaries = json.CityObjects[cityObj].geometry[0].boundaries;
  }

  //needed for assocation of global and local vertices
  var verticeId = 0

  var vertices = [] //local vertices
  var indices = [] //global vertices
  var boundary = [];

  //contains the boundary but with the right verticeId
  for (var i = 0; i < boundaries.length; i++) {

    for (var j = 0; j < boundaries[i][0].length; j++) {

      //the original index from the json file
      var index = boundaries[i][0][j];

      //if this index is already there
      if (vertices.includes(index)) {

        var vertPos = vertices.indexOf(index)
        indices.push(vertPos)
        boundary.push(vertPos)

      } else {

        //add vertice to geometry
        var point = new THREE.Vector3(
          json.vertices[index][0],
          json.vertices[index][1],
          json.vertices[index][2]
        );
        geom.vertices.push(point)

        vertices.push(index)
        indices.push(verticeId)
        boundary.push(verticeId)

        verticeId = verticeId + 1
      }

    }

    /*
    console.log("Vert", vertices);
    console.log("Indi", indices);
    console.log("bound", boundary);
    console.log("geom", geom.vertices);
    */

    //create face
    //triangulated faces
    if (boundary.length == 3) {
      geom.faces.push(
        new THREE.Face3(boundary[0], boundary[1], boundary[2])
      )

      //non triangulated faces
    } else if (boundary.length > 3) {

      //create list of points
      var pList = []
      for (var j = 0; j < boundary.length; j++) {
        pList.push({
          x: json.vertices[vertices[boundary[j]]][0],
          y: json.vertices[vertices[boundary[j]]][1],
          z: json.vertices[vertices[boundary[j]]][2]
        })
      }
      //get normal of these points
      var normal = await get_normal_newell(pList)

      //convert to 2d (for triangulation)
      var pv = []
      for (var j = 0; j < pList.length; j++) {
        var re = await to_2d(pList[j], normal)
        pv.push(re.x)
        pv.push(re.y)
      }

      //triangulate
      var tr = await earcut(pv, null, 2);

      //create faces based on triangulation
      for (var j = 0; j < tr.length; j += 3) {
        geom.faces.push(
          new THREE.Face3(
            boundary[tr[j]],
            boundary[tr[j + 1]],
            boundary[tr[j + 2]]
          )
        )
      }

    }

    //reset boundaries
    boundary = []

  }

  //needed for shadow
  geom.computeFaceNormals();

  //add geom to the list
  var _id = jsonName + "_" + cityObj
  geoms[_id] = geom

  return ("")

}

//build the attributetable
function buildInfoDiv(jsonName, cityObj) {

  var json = jsonDict[jsonName];

  //empty table
  $("#attributeTable").find("tr:gt(0)").remove();
  $("#cityObjId").text("");

  //fill table
  $("#cityObjId").text(cityObj);
  //fill table with id
  $('#attributeTable').append("<tr>" +
    "<td>id</td>" +
    "<td>" + cityObj + "</td>" +
    "</tr>")

  //fill table with attributes
  for (var key in json.CityObjects[cityObj].attributes) {
    $('#attributeTable').append("<tr>" +
      "<td>" + key + "</td>" +
      "<td>" + json.CityObjects[cityObj].attributes[key] + "</td>" +
      "</tr>")
  }

  //display attributeBox
  $("#attributeBox").show();
}

//action if mouseclick (for getting attributes ofobjects)
function getAttributes(e) {

  //if no cityjson is loaded return
  if (boolJSONload == false) {
    return
  }

  //no action if the helpbar is clicked
  if (e.target.id == "pageHelper") {
    return
  }

  //get mouseposition
  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

  //get cameraposition
  raycaster.setFromCamera(mouse, camera);

  //calculate intersects
  var intersects = raycaster.intersectObjects(meshes);

  //if clicked on nothing return
  if (intersects.length == 0) {
    return
  }

  //get the id of the first object that intersects (equals the clicked object)
  var jsonName = intersects[0].object.jsonName;
  var cityObjId = intersects[0].object.name;
  buildInfoDiv(jsonName, cityObjId);

}

//display or hide the wireframe
function toggleWireframe() {

  if (boolJSONload == false) {
    return
  }

  // start spinner
  $("#loader").show();

  var checkBox = document.getElementById("wireframeBox");
  if (checkBox.checked == true) {
    for (var i = 0; i < meshes.length; i++) {
      var currentMesh = scene.getObjectByName(meshes[i].name);
      var geo = new THREE.EdgesGeometry(currentMesh.geometry);
      var mat = new THREE.LineBasicMaterial({
        color: 0x000000,
        linewidth: .1,
        transparent: true,
        opacity: 0.2
      });
      var wireframe = new THREE.LineSegments(geo, mat);
      wireframe.name = "wireframe_" + meshes[i].name
      scene.add(wireframe);
    }

  } else {
    for (var i = 0; i < meshes.length; i++) {
      scene.remove(scene.getObjectByName("wireframe_" + meshes[i].name));
    }
  }

  renderer.render(scene, camera);

  // end spinner
  $("#loader").hide();
}

//display or hide one single cityObject
function toggleMesh(cb) {

  var index = cb.id.substring(6)

  var currentMesh = scene.getObjectByName(index);

  //set it to the original file so that is checked always works
  var parent = $("#checkFile_" + currentMesh.jsonName)
  //check if mesh has a parent
  if ($("#" + cb.id).parent().parent()[0].id != "ul_" + currentMesh.jsonName) {
    var substring = $("#" + cb.id).parent().parent()[0].id.substring(currentMesh.jsonName.length + 4)
    parent = $("#check_" + substring)
  };


  if (cb.checked) {
    if ($("#checkFile_" + currentMesh.jsonName).is(':checked') &&
      parent.is(":checked")) {
      currentMesh.traverse(function(child) {
        child.visible = true;
      });
    }
  } else {
    currentMesh.traverse(function(child) {
      child.visible = false;
    });
  }

  renderer.render(scene, camera);
}

//display or hide a parent
function toggleParent(cb) {

  console.log("TODO: implement checking system for parent/children with n-th deep");

  //get children of element
  var children = $("#" + cb.id).parent().next().children();

  if (cb.checked) {
    for (var i in children) {
      //workaround to avoid error messages of undefined children (that somehow happen)
      if (children[i].tagName != "LI") {
        continue
      }
      var index = children[i].firstChild.id.substring(6);
      var currentMesh = scene.getObjectByName(index);
      if ($("#checkFile_" + currentMesh.jsonName).is(':checked') &&
        $("#check_" + index).is(':checked')) {
        currentMesh.traverse(function(child) {
          child.visible = true;
        });
      }
    }
  } else {
    for (var i in children) {
      //workaround to avoid error messages of undefined children (that somehow happen)
      if (children[i].tagName != "LI") {
        continue
      }
      var index = children[i].firstChild.id.substring(6);
      var currentMesh = scene.getObjectByName(index);
      currentMesh.traverse(function(child) {
        child.visible = false;
      });
    }
  }
  renderer.render(scene, camera);

}

//toggle all meshes from a file
function toggleFile(cb) {
  var index = cb.id.substring(10)

  if (cb.checked) {
    for (var i = 0; i < meshes.length; i++) {
      var currentMesh = scene.getObjectByName(meshes[i].name);
      if ($("#check_" + meshes[i].name).is(':checked')) {
        if (currentMesh.jsonName == index) {
          currentMesh.traverse(function(child) {
            child.visible = true;
          });
        }
      }
    }
  } else {
    for (var i = 0; i < meshes.length; i++) {
      var currentMesh = scene.getObjectByName(meshes[i].name);
      if (currentMesh.jsonName == index) {
        currentMesh.traverse(function(child) {
          child.visible = false;
        });
      }
    }
  }
  renderer.render(scene, camera);

}

//toggle the treeview
function toggleTree(cb) {
  var val = $("#" + cb.id).text()
  var id = $("#" + cb.id).attr('id').substring(5)

  if (val == "▽") {
    $("#" + cb.id).text("▷")
    $("#ul_" + id).hide()
  } else {
    $("#" + cb.id).text("▽")
    $("#ul_" + id).show()
  }
}

function addAxisHelper() {

  var CANVAS_WIDTH = 200;
  var CANVAS_HEIGHT = 200;
  var CAM_DISTANCE = 300;


  var container2 = document.getElementById("axisHelper")
  var renderer2 = new THREE.WebGLRenderer();
  renderer2.setClearColor(0xf0f0f0, 1);
  renderer2.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  container2.appendChild(renderer2.domElement);

  // scene
  scene2 = new THREE.Scene();

  // camera
  camera2 = new THREE.PerspectiveCamera(50, CANVAS_WIDTH / CANVAS_HEIGHT, 1, 1000);
  camera2.up = camera.up; // important!

  // axes
  axes2 = new THREE.AxesHelper(100);
  scene2.add(axes2);

  renderer2.render(scene2, camera2)

}
