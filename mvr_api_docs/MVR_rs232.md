# RS232 connection

It's possible to conect to MVR device over RS232 USB serial connection. 
Same [API](MVR_api.md) works as for case of Internet connection, with few differences that are explained here.


## Protocol

Standard API uses http protocol over TCP/IP line. RS232 uses serial connection over USB cable or Bluetooth serial connection, with following details:

- Session ID is not used, each RS232 connection has automatic unique session ID (API user doesn't need to care about this)
- Authorization in `begin` command uses different way to send username/password
- Same rules of exclusive access to device exists as with main API, that is beginning and ending session is still necessary
- Each command sent to device must be sent on one line, terminated by new-line character (except of when posting binary data as explained below)
- Every reply to command is on single line, terminated by '\n' character (except of when sending back binary data as explained below)
- Encoding of strings is utf-8
- Most GET api commands don't need active session (begin/end): storages, cameras, folders, files, file_info, file_thumbnail,
    study/status, time, pacs, study/notify


### Format of request

`<method> <path> [<command-id>] [<optional data>]\n`

- method is one of standard http [methods](https://www.restapitutorial.com/lessons/httpmethods.html): GET, POST, PUT, DELETE
- path is usual API command path, without the `/api/` part
- command-id is optional string that MVR return back as part of reply; this is intended for pairing reply with request on client side
- optional data are post-data required for some commnands, these data are read to end of line, so may contain additional whitespace characters (except of new-line)

Example:  
`POST begin 13 { "DeviceName": "Samsung S8", "AppVersion": "MVR-190629" }\n`

For most commands client can expect one reply for one request. However, `notify` kinds of commands work asynchronously, 
that's where `command-id` is utilized to know to which command the reply was sent.

#### Authorization

In the begin command, client sends user authorization (password or username and password for identifying valid user) inside
of json object (the optional data).

Example:  
`POST begin 13 { "user": "admin", "pass": "abc123" }\n`

#### Sending request with binary data

In case of binary data sent as `<optional data>`, the format is following:  
After 3rd word token of command, client must send byte \0, following by string (decimal number) specifying size of following binary data, terminated by single space character. 
Right after terminating space character follow binary data of specified size. No terminating '\n' is needed after such formatted command.

Sending binary data is rare for commands uploading a file.
Most commands use data as JSON string (that implies that JSON data can't contain new-lines).


### Format of reply

`<json reply>\n[optional data]`

The reply is always a string in json format, terminated by new-line character.

The reply contains these fields:
```
{
    "id": "13", // command-id as sent by client
    "error": "<text>", // optional error text in case that command execution failed
    "reply": "<string data>", // optional data in case that command returns string data
}
```

### Notify commands

The notify (async) commands work also over serial connection. 
However, because requests and responses don't run over dedicated connection (like http connection works), notify requests can't be terminated by closing connection. 
For this purpose, rs232 processor adds command to stop notifications for given command id:

#### `CANCEL <id-to-cancel> [<command-id>]`

This will stop notification which was started previously with `id-to-cancel`. 
This is command like others, so optionally this request can have own `command-id`.  
This also implies that each active notification must use unique command id. 
Starting new notification comand with command id of already running notification will first cancel previous notification.


### File transfer

##### Download:

Downloaded files are retrieved in chunks of bytes. One file may be sent in one or more chunks.
Because files may be large, they're sent in smaller parts (approx 1KB), so that other data can be also transferred while a file is downloaded.

After file download request (`GET files/<type>/<path>`), 1st reply is normal reply as written above.
If file length is known, the `reply` includes `"length": 12345` field.

Following are chunks of file's data until `eof` is included in the chunk reply.  
The reply to file download command is following:
```
{
    "id": "13", // command-id as sent by client; the id used in file-download request
    "chunk": 123, // size of binary data chunk following the last new-line character after json object
    "eof": true // signal that this is last chunk and end of file; no more data will arrive for this command
}
```

Downloading of file is cancelable. To cancel file download, send request:

#### `CANCEL <command-id>`

This will stop file download for given request id. No more file data will be sent after this.
