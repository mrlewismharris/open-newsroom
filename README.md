# open-newsroom
Open Newsroom for OBS

## Still WIP
An "Open Newsroom" app, will have advanced features to create complex prefab templates to display on the OBS stream. Still extremely early so please don't expect anything too serious yet!

Watch this space!

## Todo:
* Server Console command implementation
 * Server-side: CRUD json (containing prefab collections), CRUD for each prefab collection, CRUD for each prefab, CRUD for each element within the prefab collection? (Maybe doesn't need to be this decomposed? Will think about it)
* Get current scene and display on "/obs" page on refresh
* Add "save scene" to save scenes and their info to text file
* Logging for server events

## Future Ideas:
* Moving coords, with special consideration for sources and polling @ 1000/framerate. X Y coords (and Z for depth/scale in 3D space) for an element's position on screen can be parsed from an API so complex external software can be used in realtime. For example Python's Open CV library could be used to scan a live camera feed with object detection and output the coords of that object, feed the realtime data to open-newsroom, which would use the coords as the base position of any element - particularly exciting for sports.
* Track element input text, i.e. an API parses info that is displayed on the screen (with proper polling rate of 1000/framerate)
