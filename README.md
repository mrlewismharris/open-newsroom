# open-newsroom
A server and webapp for creating complex scenes for OBS to use with the browser source (or any software with a browser source alternative). To be used as a more responsive alternative, especially for larger scale events, to composite prefabricated graphics and overlays

## Still WIP
Ypu're early so please don't expect anything too serious yet!

## Todo:
* Server Console command implementation
 * Server-side: CRUD json (containing prefab collections), CRUD for each prefab collection, CRUD for each prefab, CRUD for each element within the prefab collection? (Maybe doesn't need to be this decomposed? Will think about it)
* Get current scene and display on "/obs" page on refresh
* Timeline functionality to traverse scenes (forward/back/jump-to)
* Add "save scene" to save scenes and their info to json file
* Import scenes - select a json file and import scenes a folders into that JSON file (should merge folders together, or give choice)
* Add "Quick settings" checkbox next to any setting when making a prefab, so users can indicate and add custom labels to specific settings to be editted when using a prefab, e.g. "Header Text" next to a text element, "Background Colour", etc. These will be in-fact NECESSARY for users, so that when they add an element it doesn't display placeholder data, but actual replacement text.
* Logging for server events

## Future Ideas:
* Moving coords, with special consideration for sources and polling @ 1000/framerate. X Y coords (and Z for depth/scale in 3D space) for an element's position on screen can be parsed from an API so complex external software can be used in realtime. For example Python's Open CV library could be used to scan a live camera feed with object detection and output the coords of that object, feed the realtime data to open-newsroom, which would use the coords as the base position of any element - particularly exciting for sports.
* Track element input text, i.e. an API parses info that is displayed on the screen (with proper polling rate of 1000/framerate)
