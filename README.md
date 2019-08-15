# CityJSON viewer v2

![CityJSON example](readme/example_Delft.PNG?raw=true "")

A simple web-viewer for [CityJSON](https://www.cityjson.org) files: drag-and-drop a file, wait a few milliseconds, and you see it. That's it. This is an updated version of the CityJSON viewer with following functions:

  - get attribute information of city objects
  - load multiple files at the same time
  - supporting of parent/children
  - hide/show complete file or single objects
  - shadow support for presentation
  - smoother controls
  - cleaned up code

You can access it online at [https://tudelft3d.github.io/CityJSON-viewer/](https://tudelft3d.github.io/CityJSON-viewer/). This program will regulary be updated.

## Not supported (yet)

  - geometry templates (nothing will be drawn)
  - textures and material
  - support world position of the files
  - choosing the colours, these are hard-coded for the CityJSON classes
  - offline support
  - enable editing and downloading of the files

## Technical Background

This viewer is realised using the WebGL-Library [Three.js](https://threejs.org/). Following steps are done when a valid json file is uploaded:

  1) load JSON-file into the internal memory of the browser
  2) normalize all vertices
  3) for every CityObject in the JSON a Three.js-geometry is created. 
  4) add the object to the viewer
  5) add an equivalent entry to the left-sided overview
  6) draw the scene
 
In contrary to version1 of the CityJSON-viewer, now every CItyObject has its own geometry (before all objects belonged to one geometry) This allows an unique identification of the object (for getting the attribute information) and for display/hide mechanics. A drawback is a slightly longer loading time. For the creation of a Three.js-geometry the polygons of the CityObject need to be triangulated. If this is not the case, the polygons are beforehand triangulated using the [earcut-library](https://github.com/mapbox/earcut)  

For getting the attribute information of an object the raycaster functionality of the Three.js library is used. It allows to determine which object is in the front (and therefore is clicked on) and gets its unique ID. This ID can be used to look up the attribute information in the JSON-data.

## Datasets

We provide a test dataset in the `data` folder.
It is a part of the Delft in the Netherlands was automatically reconstructed with [3dfier](https://github.com/tudelft3d/3dfier).

Other datasets freely available on the [CityJSON website](https://www.cityjson.org/en/0.9/datasets/).


## Acknowledgements

This viewer was originally built by [Freek Boersma](https://github.com/fhb1990) for a [Research Assignment](https://3d.bk.tudelft.nl/courses/geo5010/) in the [Msc Geomatics at Delft University of Technology](geomatics.tudelft.nl). The updated Version was created by [Felix Dahle](https://github.com/fdahle).
