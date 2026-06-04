# MVR API Demo

Static browser demo for controlling MVR recorders through the HTTP API on port `3333`.

Open `index.html` directly from local storage in a web browser. No build step or package install is required.

`index.html` is intentionally self-contained: CSS and JavaScript are embedded in the file. This is necessary for Chrome when a file is opened through the Linux desktop document portal, where Chrome may receive access only to `index.html` and not to neighboring files.

## Features

- Probe a known MVR IP address with unauthenticated `GET /api/device`.
- Scan a small IPv4 range for devices.
- Select a recorder and show public device information.
- Login with `POST /api/begin`, hashing the password to MD5 before Basic Auth.
- Use the returned or fixed `X-session` value for session commands.
- Refresh protected info: network adapters, cameras, storages, study status, and settings summary.
- Start and finish a study.
- Capture a snapshot, optionally returning a JPG preview and download link.
- Start and stop video recording.
- Logout with `POST /api/end`.
- Maintain a request log for troubleshooting.

## Browser And Device Requirements

The MVR API is plain HTTP. Browser requests from a local `file://` page still depend on browser networking rules and the recorder firmware:

- The recorder must be reachable from the computer at `http://<ip>:3333/api/`.
- The browser must be allowed to call the recorder from a local page.
- The recorder must allow CORS requests for browser `fetch`.
- For automatic session capture, the recorder should expose the `X-session` response header to CORS.

The app is designed to run fully offline. It does not load fonts, scripts, icons, CSS frameworks, or images from the internet. All UI code is in the local `index.html`, `styles.css`, and `app.js` files.

## Chrome Notes

Open the file in Chrome as:

```text
file:///home/alex/Projects/mvr_api_demo/index.html
```

Chrome can also open the file through a document portal path such as `/run/user/1000/doc/...`. The app still works in that mode because `index.html` contains its own CSS and JavaScript.

For API calls, Chrome follows stricter browser security rules than curl. If the recorder does not support CORS, Chrome will show the CORS diagnostic in the request log even though direct curl works.

On the tested recorder at `192.168.2.102`, direct curl works:

```bash
curl -i http://192.168.2.102:3333/api/device
```

It returns HTTP 200 JSON, but it does not send `Access-Control-Allow-Origin`, and it returns `400 Unknown method` for CORS `OPTIONS` preflight. A normal browser therefore blocks the static page before JavaScript can read the response. This is a browser security limit, not a wrong port or URL.

Practical ways to run the demo are:

- Enable CORS support in MVR firmware for the API, including `OPTIONS` preflight and exposing `X-session`.
- Use a demo-only browser profile launched with web security disabled.
- Put a small same-origin or CORS-adding proxy between the browser and MVR. This is the most robust option, but it is a server, so it is outside the original static-only constraint.

If login succeeds but the app cannot read `X-session`, enter a fixed Session ID before logging in. The app sends that ID in the `begin` request and then uses `?session=<id>` on later commands.

If every request fails with `Failed to fetch`, check the IP address, network route, and CORS support on the recorder.

## API Notes

The app follows the API documents in `/home/alex/StudioProjects/mvr/api`:

- Discovery: `GET /api/device`
- Login: `POST /api/begin`
- Logout: `POST /api/end`
- Keep alive: `GET /api/ping`
- Device details: `GET /api/device/net/lan`, `GET /api/device/net/wifi`
- Cameras: `GET /api/cameras`
- Storages: `GET /api/storages`
- Settings: `GET /api/settings`
- Study status: `GET /api/study/status`
- Study lifecycle: `PUT /api/study/start`, `PUT /api/study/finish`
- Snapshot: `PUT /api/study/snapshot` or `PUT /api/study/snapshot/jpg`
- Video recording: `PUT /api/study/record/start`, `PUT /api/study/record/stop`

## Security

The app stores device addresses, the last username, and UI preferences in `localStorage`. It does not store the password or active session ID.

The MVR API requires the password to be sent as an MD5 hash inside Basic Auth. MD5 is implemented in `app.js` only to match the recorder API. It is not suitable for new security-sensitive designs.

## Files

- `index.html`: self-contained browser UI used by Chrome/Firefox
- `styles.css`: maintenance copy of responsive layout and control styling
- `app.js`: maintenance copy of API calls, device discovery, session state, and MD5 helper
- `README.md`: usage and maintenance notes
