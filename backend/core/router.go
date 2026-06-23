package main

import (
	"net/http"
	"strings"
)

func NewRouter(cfg Config) (http.Handler, error) {
	frontendFS, err := frontendFileSystem(cfg)
	if err != nil {
		return nil, err
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/env.js", ServeEnvJS(cfg))

	// Auth endpoints — fuori dal requireAuth
	mux.HandleFunc("POST /api/login",      loginHandler(cfg))
	mux.HandleFunc("POST /api/logout",     logoutHandler)
	mux.HandleFunc("GET /api/auth/status", authStatusHandler)

	// Tutto il resto di /api/ passa per requireAuth poi proxy
	mux.Handle("/api/", requireAuth(cfg, apiProxy(cfg)))

	mux.Handle("/", spaHandler(frontendFS))

	return securityHeaders(mux), nil
}

func spaHandler(fileSystem http.FileSystem) http.Handler {
	fileServer := http.FileServer(fileSystem)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}
		f, err := fileSystem.Open(path)
		if err == nil {
			_ = f.Close()
			fileServer.ServeHTTP(w, r)
			return
		}
		r.URL.Path = "/index.html"
		fileServer.ServeHTTP(w, r)
	})
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = jsonNewEncoder(w).Encode(body)
}
