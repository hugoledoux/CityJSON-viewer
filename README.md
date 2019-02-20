
# CityJSON viewer

A simple web-viewer for [CityJSON](https://www.cityjson.org) files: drag-and-drop a file, wait a few milliseconds, and you see it. That's it.

You can access it online at [https://tudelft3d.github.io/CityJSON-viewer/](https://tudelft3d.github.io/CityJSON-viewer/)

## Not supported (yet)

  - geometry templates (nothing will be drawn)
  - textures and material
  - loading multiple files (now if you drop a new file, the old one is removed)
  - choosing the colours, these are hard-coded for the CityJSON classes
  - querying attributes of the object

## Datasets

We provide a test dataset in the `data` folder.
It is a part of the Delft in the Netherlands was automatically reconstructed with [3dfier](https://github.com/tudelft3d/3dfier).

Other datasets freely available on the [CityJSON website](https://www.cityjson.org/en/0.9/datasets/).


## Acknowledgements

This viewer was originally built by [Freek Boersma](https://github.com/fhb1990) for a [Research Assignment](https://3d.bk.tudelft.nl/courses/geo5010/) in the [Msc Geomatics at Delft University of Technology](geomatics.tudelft.nl).
