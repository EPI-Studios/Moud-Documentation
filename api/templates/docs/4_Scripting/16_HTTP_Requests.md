# HTTP Requests

The `http` API provides asynchronous, outbound HTTP and HTTPS request capabilities. This API evaluates strictly within the server environment.

```hint danger Server-side execution only
Client-side scripts cannot execute HTTP requests. To trigger an external request from a client, route a local instruction to a server script utilizing the `node.net` messaging system, and execute the outbound request from the server context.
```

---

## API reference

All HTTP methods execute asynchronously. The engine assigns requests to a background thread pool and queues the resulting callback to execute on the primary server tick thread. This synchronization guarantees thread-safe mutation of the scene graph and player states without explicit locking mechanisms.

### Methods

| Method | Description |
|---|---|
| `get(url: string, [headers: table], callback: function)` | Executes an HTTP GET request. The `headers` table is optional. |
| `postJson(url: string, body: string, [headers: table], callback: function)` | Executes an HTTP POST request with a JSON payload. The `headers` table is optional. |
| `postForm(url: string, body: table, callback: function)` | Executes an HTTP POST request formatting the provided table as `application/x-www-form-urlencoded`. |

### Callback signature

The callback function receives four parameters upon completion or failure: `(status, body, headers, err)`.

| Parameter | Type | Description |
|---|---|---|
| `status` | int | The HTTP response status code. Evaluates to `0` if the request fails prior to receiving a response. |
| `body` | string | The raw response payload. Evaluates to `""` on failure. Responses exceeding 2 MB are automatically truncated. |
| `headers` | table | A key-value map of the response headers (evaluating the first string value per key). |
| `err` | string | The network exception string. Evaluates to `""` if the request succeeds. Common exceptions include `invalid url`, `unsupported scheme`, or `host blocked`. |

---

## Execution lifecycle

1.  **Dispatch:** The script invokes an API method. The request is assigned to a background executor pool (globally limited to 4 concurrent threads).
2.  **Resolution:** Upon receiving a network response or encountering a timeout, the engine queues the callback function.
3.  **Execution:** During the subsequent server tick, the engine flushes all pending callbacks sequentially on the main thread, prior to standard script evaluation.
4.  **Disposal:** If the originating script is unloaded or destroyed before the callback executes, the engine safely discards the callback without throwing a runtime exception.

---

## Network constraints and security

The engine enforces strict limitations on outbound traffic to ensure server stability and mitigate vulnerabilities.

| Constraint | Enforcement behavior |
|---|---|
| **Protocol filtering** | The URI scheme must strictly evaluate to `http` or `https`. Alternate schemes (e.g., `file://`, `ftp://`) are rejected prior to execution. |
| **SSRF protection** | The engine resolves DNS server-side and blocks traffic routing to private, loopback, link-local, or multicast IP ranges (e.g., `localhost`, `127.0.0.0/8`, `10.0.0.0/8`, `192.168.0.0/16`). |
| **Timeouts** | Connection attempts timeout after **5 seconds**. Active request reads timeout after **10 seconds**. |
| **Payload limits** | Response bodies are clamped to a strict **2 MB** limit. Excess bytes are truncated. Streaming and multipart file uploads are currently unsupported. |
| **State persistence** | The HTTP client is stateless. Cookies and session data do not persist between independent requests. |

---

## Implementation examples

### Remote configuration retrieval

Executes a GET request during initialization to retrieve and cache remote JSON data into the global persistence map.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";
import { http } from "moud/net";

export default class RemoteConfig extends Node3D {
  @ready()
  onReady() {
    http.get("https://config.example.com/event.json", (status, body, headers, err) => {
      if (err !== "") {
        console.error(`Request failed: ${err}`);
        return;
      }
      
      if (status === 200) {
        this.persist.setWorld("active_event", body);
      }
    });
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    api.http().get("https://config.example.com/event.json", (status, body, headers, err) => {
      if (err !== "") {
        api.log(`Request failed: ${err}`);
        return;
      }
      
      if (status === 200) {
        api.persist().setWorld("active_event", body);
      }
    });
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_ready(api)
    api:http():get("https://config.example.com/event.json", function(status, body, headers, err)
        if err ~= "" then
            api.log("Request failed: " .. err)
            return
        end
        
        if status == 200 then
            api:persist():setWorld("active_event", body)
        end
    end)
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class RemoteConfig extends NodeScript {
    @Override 
    public void onReady() {
        http.get("https://config.example.com/event.json", (status, body, headers, err) -> {
            if (!err.isEmpty()) {
                core.log("Request failed: " + err);
                return;
            }
            
            if (status == 200) {
                persist.setWorld("active_event", body);
            }
        });
    }
}
```
````

### Telemetry dispatch

Executes a POST request with explicit authorization headers to transmit game events to an external analytics endpoint.

````tabs
--- tab: Luau
```lua
local script = {}

function script:onPlayerDeath(api, playerUuid, cause)
    local url = "https://analytics.example.com/death"
    local payload = '{"uuid":"' .. playerUuid .. '","cause":"' .. cause .. '"}'
    local headers = { Authorization = "Bearer abc123_token" }

    api:http():postJson(url, payload, headers, function(status, body, resHeaders, err)
        if err ~= "" then
            api.log("Telemetry dispatch failed: " .. err)
        end
    end)
end

return script
```
````