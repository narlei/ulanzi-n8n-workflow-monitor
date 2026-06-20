# Third-Party Licenses

This plugin bundles the following third-party library. It is the property of its
respective authors and is distributed under its own license.

| Component | Use | License | Copyright |
|-----------|-----|---------|-----------|
| `ws` (`node_modules/ws`) | WebSocket client for the Ulanzi SDK channel | MIT | © 2011 Einar Otto Stangvik and contributors |
| `libs/node/*`, `libs/js/*` | Ulanzi UlanziDeck SDK | © Ulanzi | © Ulanzi Technology |

No external online services are used. Workflow status is read with plain HTTPS
requests to the n8n REST API on the host the user configures, via Node's built-in
`fetch` — no third-party API, no telemetry, and the API key never leaves the machine.

## Desktop notifications

Notifications use the operating system's own tools via `child_process`:
- **Windows:** PowerShell + the Windows Toast API (no bundled binary).
- **macOS:** the built-in `osascript` (`display notification`) — works with zero setup. If [`terminal-notifier`](https://github.com/julienXX/terminal-notifier) (MIT, © Julien Blanchard) is installed (`brew install terminal-notifier`), it is used instead for a custom icon. It is **not** bundled, because unsigned notification helpers are silently blocked on modern macOS.

---

## MIT License (ws)

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the above copyright notice and this permission
notice being included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```
