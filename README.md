# tish-browser-server

In-browser shims for `http`, `fs`, and `process` — same API surface as the host modules, implemented over Service Worker / BroadcastChannel / IndexedDB. **Pure Tish, zero JS deps.**

Lets capstone-style lessons in [`tish-learn`](https://github.com/tishlang/tish-learn) build "server-shaped" projects (REST APIs, real-time chat, blog generators) without anyone having to deploy a backend or open a terminal. Everything runs in the learner's tab.

## What you get

| API surface | Real `'http'` / `'fs'` / `'process'` | This package |
|---|---|---|
| `serve(port, handler)` | binds a TCP port, dispatches HTTP requests | registers a Service Worker that intercepts in-page `fetch()` and routes through your handler |
| `new WebSocket(url)` (`bc://...`) | opens a real socket to a remote host | a `BroadcastChannel`-backed shim that delivers messages between same-origin tabs |
| `readFile`/`writeFile`/`fileExists`/`readDir`/`mkdir` | reads/writes files on the host filesystem | reads/writes a virtual disk in IndexedDB; survives reload |
| `process.env`, `process.argv`, `process.cwd`, `process.exit` | host process info | mocked from the page's query-string + `localStorage` |
| `fetch(url, opts)` | network HTTP client | passthrough to native `window.fetch` |

## "Take-it-real" pattern

Every capstone in tish-learn closes with a one-line diff: change the import path and the same code runs on a real Tish server, deployable as a single binary.

```diff
- import { serve, readFile, writeFile } from "tish-browser-server"
+ import { serve } from "http"
+ import { readFile, writeFile } from "fs"
```

## Quick example

```tish
import { serve, readFile, writeFile } from "tish-browser-server"

let notes = []
async fn loadNotes() {
  try {
    let raw = await readFile("/notes.json")
    if (typeof raw === "string") { notes = JSON.parse(raw) }
  } catch (e) { }
}
async fn saveNotes() {
  await writeFile("/notes.json", JSON.stringify(notes))
}

await loadNotes()

await serve(8080, async (req) => {
  if (req.method === "GET" && req.path === "/api/notes") {
    return { status: 200, body: notes }
  }
  if (req.method === "POST" && req.path === "/api/notes") {
    let n = JSON.parse(req.body)
    notes.push(n)
    await saveNotes()
    return { status: 201, body: n }
  }
  return { status: 404, body: "Not Found" }
})

// Now anywhere in the same tab:
//   let res = await fetch("/api/notes")
//   let list = await res.json()
```

## Real-time chat with two tabs

```tish
import { createBcWebSocket } from "tish-browser-server"

let ws = createBcWebSocket("bc://chat/general")
ws.onopen = () => console.log("connected")
ws.onmessage = (ev) => console.log("got:", ev.data)
ws.send("hi from tab 1")
```

Open the same page in another tab, run the same code, and they'll see each other's messages instantly.

## Service Worker setup

The host page must serve the worker script at `/dist/tish-sw.js`. In tish-learn we generate it via `tish build --target js` on `node_modules/tish-browser-server/src/sw_worker.tish` as part of the build. See [`tish-learn/justfile`](https://github.com/tishlang/tish-learn) for the recipe.

## Why "no backend" matters

`tish-playground` runs the entire Tish compiler + VM in the browser. We extend that promise to the curriculum: open a tab, learn, ship something — no Docker, no Heroku, no SSH. If you outgrow the browser sandbox, the **take-it-real** diff is one line away.

## License

[MIT](LICENSE)
