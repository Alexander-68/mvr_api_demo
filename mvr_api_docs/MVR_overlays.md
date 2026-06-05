# Overlays

MVR API offers mechanism to place overlay image on top of video input. 
Overlays are drawn on preview screen, as well as written into recorded images and videos.

The purpose of overlay is to display additional information on top of image from camera.

It's possible to put custom overlays only when using MVR API (not when interacting with device directly).


## Definition of overlay

Overlay is a rectangle placed on screen. It can have background, defined by image (png or jpg), or solid color. 
It can be placed in one of 9 basic positions on screen (top-left, top, top-right, left, center, right, bottom-left, bottom, bottom-right).

Additionally it can be offset from this position horizontally and vertically, so for example it can be positioned at some distance from screen edge.

By default, overlay is placed within screen bounds, but optional parameter `fitToAreaOfInterest` allows to place overlay within area of interest (AOI) defined for camera.

The rectange has size normally determined from its background image, but the size may be overriden in horizontal or vertical dimensions, or both. If you override only one dimension, other one will be automatically computed to retain aspect ratio of background image.
In case of no or solid-color background, size must be specified.

Sizes and offsets are specified in pixels for reference full-hd resolution (1920x1080). 
In case of camera signal in different resolutuion (e.g. 4K), orverlay size is automatically resized so that it retains same relative position and size, as if camera signal was in full-hd resolution. 

Overlay can show additional information in text format. Multiple texts can be placed in each overlay.


##### Errors

For possible errors in json definition of overlay, MVR attempts to show failure as overlay with special background with blue X cross, or even error text in the overlay.
The reason is that errors in definitions are not silently ignored, but visually shown so that they can be fixed.


### Colors

Whenever color is specified in json, it is set as string in form:
"#RRGGBB", "#AARRGGBB" or one of the following names: "red", "blue", "green", "black", "white", "gray", "cyan", "magenta", 
"yellow", "lightgray", "darkgray", "aqua", "fuchsia", "lime", "maroon", "navy", "olive", "purple", "silver", "teal"

### Background

Following background types are possible:

- No background
- Image from png or jpg file stored in local folder on device's storage (iMave folder)
- Image uploaded by API command (in png or jpg format) 
- Solid color, in format described in *Colors* 

Background images can have transparent pixels.


## Elements

Following are elements that can be placed into overlays.


### Text

Texts are drawn on top of background, within overlay's rectangle.  
Each text have position defined same way as the overlay, but it's relative to overlay's rectangle, that is one of 9 possible placements.


### Images

Images allow to place another image into overlay. This may be some indicator or other image that can move within overlay. 


## Lifetime and updating

Overlays can be created, updated and deleted. You can make each API operation on one overlay or on array of overlays, so it's possible to batch operation on multiple overlays in one API call.  
Updating of overlay can change certain properties of overlay (those that you specify in json data), and won't touch other fields.
Updating of overlay can't create new or delete existing elements of overlay.  
If structure of your overlay changes significantly, you have to recreate the overlay and not update it.  
If you need to show or hide some elements of overlay, you can create such element as invisible, and later change its visibility.


### API

#### Create overlay

#### `POST /api/study/overlays`

POST-data:
```
{
    "id": 1, // optional identifier of overlay; used to update or remove it
    "position": { // optional position of overlay
        "alignment": "R", // optional alignment, one of TL, T, TR, L, C, R, BL, B, BR (defaults to C)
        "width": 200, "height": 350, // optional size of overlay, in pixels; each dimension may be omited
        "offsetX": -110, "offsetY": 30 // optional offset of overlay (in pixels) from its ideal position defined by alignment
    },
    "fitToAreaOfInterest": true, // optional flag to fit overlay into area of interest
    "backgroundColor": "red", // optional background color, in format described in Colors
    "backgroundLocalFile": "sample.png", // optional file name of image used for background (relative to iMave folder on device)
    "elements": [ // optional array of sub-elemements in overlay
        {
            "id": 1, // optional identifier of element; used to update it
            "type": "text", // type of element one of "text" or "image"
            "position": { // mandatory position of element; format is same as for overlay's position
                "alignment": "B",
                "offsetY": -4
            },
            "size": 16, // optional size of text in pixels (integer of float)
            "color": "green", // optional text color; default is white
            "backgroundColor": "#40000080", // optional background color; default is transparent
            "text": "Fully charged and ready for service", // optional text
            "shadow": 1 // optional shadow; value 0 or 1
        },
        {
            "type": "image",
            "position": {
                "alignment": "L",
                "offsetY": -40
            },
            "visible": true, // optional element visibility, default is true
            "localFile": "arrow.png", // mandatory file name; for format see backgroundLocalFile 
            "pivotX": 0.5, "pivotY": 0.9, // optional pivot, in relative coordinates of image's rectange; pivot is used for image rotation
            "rotation": 75 // optional rotation andgle in degrees
        }
    ]
}
```

Creates new overlay. If overlay with given `id` already exists, it is removed first.

#### Create multiple overlays

#### `POST /api/study/overlays`

POST-data:
```
[
  { 
     // object of overlay 1
  },
  {
     // object of overlay 2
  }, ...
]
```

Create multiple overlays in one call. The difference from single overlay creation is that data represent JSON array (start with '[' character), and contain array of items to create.  
The format of overlay is same as for single overlay creation. 

---

#### Update overlay

#### `PUT /api/study/overlays/<id>`

POST-data:
```
{
    "backgroundColor": "red",
    "position": {
        "offsetX": -10
    }
}
```

Update parameters of existing overlay. Overlay is identified by `id`. POST-data contain json object with overlay’s new fields.
Specified fields of overlay will be updated and overlay will be redrawn. You should post only fields that are changing.  
Only these fields of element can be updated:
- position (individually any of position fields, e.g. only offsetX)
- backgroundColor
- backgroundLocalFile

Note: to update parameters of individual elements, use following API function.

---

#### Update overlay's element

#### `PUT /api/study/overlays/<id>/<element-id>`

POST-data:
```
{
    "color": "green",
    "text": "Oxygen: 27"
}
```

Update element in existing overlay. Overlay is identified by `id` and element is identified by `element-id`. POST-data contain json object with element's new fields.  
Only these fields of element can be updated:
- text: text, size, color, backgroundColor, visible
- image: rotation, visible

---

#### Update multiple overlays

#### `PUT /api/study/overlays`

POST-data:
```
[
    {
        "id": 1, // needed identifier of overlay to be updated
        "elements": [ // optional array of elemements to update
            {
                "id": 1, // needed identifier of element to be updated
            }, ...
        ], 
        // other update data of overlay
    }, ...
]
```

Update multiple overlays, where post data contain json array of items to be updated.

---

#### `DELETE /api/study/overlays/<id[,id2,id3,...]>`

Remove overlay with given `id`. The last path segment is single id, or list of id's to delete, separated by comma.

---
