package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
)

// apiProxy returns a handler that reverse-proxies /api/* to the bridge at cfg.BridgeURL.
// On connection errors it returns a JSON error instead of Go's default HTML page.
func apiProxy(cfg Config) http.Handler {
	target, err := url.Parse(cfg.BridgeURL)
	if err != nil {
		log.Fatalf("invalid BRIDGE_URL %q: %v", cfg.BridgeURL, err)
	}
	rp := httputil.NewSingleHostReverseProxy(target)
	rp.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("proxy error %s %s: %v", r.Method, r.URL.Path, err)
		writeJSON(w, http.StatusBadGateway, map[string]any{
			"ok":    false,
			"error": "bridge non raggiungibile: " + err.Error(),
		})
	}
	return rp
}
