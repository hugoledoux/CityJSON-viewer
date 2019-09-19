
# CityJSON viewer

![CityJSON example](readme/example_Delft.PNG?raw=true "")

A simple web-viewer for [CityJSON](https://www.cityjson.org) files: drag-and-drop a file, wait a few milliseconds, and you see it. That's it. 

It has the following functions: 

  - get attribute information of city objects
  - load multiple files at the same time
  - supporting of parent/children
  - hide/show complete file or single objects
  - shadow support for presentation
  - smoother controls
  - cleaned up code

You can access it online at [https://tudelft3d.github.io/CityJSON-viewer/](https://tudelft3d.github.io/CityJSON-viewer/). 

## Not supported (yet)

  - geometry templates (nothing will be drawn)
  - textures and material
  - support world position of the files
  - choosing the colours, these are hard-coded for the CityJSON classes
  - offline support
  - enable editing and downloading of the files

## Technical Background

This viewer uses the WebGL library [Three.js](https://threejs.org/). 
The following steps are done when a valid json file is uploaded:

  1. load JSON-file into the internal memory of the browser
  2. normalize all vertices
  3. for every CityObject in the JSON a Three.js-geometry is created. 
  4. add the object to the viewer
  5. add an equivalent entry to the left-sided overview
  6. draw the scene
 
Contrary to version 1 of the CityJSON-viewer, now every City Object has its own geometry (before all objects belonged to one geometry).
This allows an unique identification of the object (for getting the attribute information) and for display/hide mechanics. 
A drawback is a slightly longer loading time. 

For the creation of a Three.js-geometry the polygons of the CityObject need to be triangulated. If this is not the case, the polygons are beforehand triangulated using the [earcut-library](https://github.com/mapbox/earcut).

For getting the attribute information of an object the raycaster functionality of the Three.js library is used. 
It allows to determine which object is in the front (and therefore is clicked on) and gets its unique ID. This ID can be used to look up the attribute information in the JSON-data.

## Datasets

We provide a test dataset in the `data` folder.
It is a part of the Delft in the Netherlands was automatically reconstructed with [3dfier](https://github.com/tudelft3d/3dfier).

Other datasets freely available on the [CityJSON website](https://www.cityjson.org/en/0.9/datasets/).


## Acknowledgements

  - [Freek Boersma](https://github.com/fhb1990)
  - [Tom Commandeur](https://github.com/tcommandeur)
  - [Felix Dahle](https://github.com/fdahle)
  - [Hugo Ledoux](https://github.com/hugoledoux/)

The viewer was mostly developed through projects in the course [Research Assignment](https://3d.bk.tudelft.nl/courses/geo5010/) in the [Msc Geomatics at Delft University of Technology](https://geomatics.tudelft.nl).
