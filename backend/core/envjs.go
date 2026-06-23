package main

import (
	"encoding/json"
	"net/http"
	"strings"
)

func ServeEnvJS(cfg Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")

		clientEnv := map[string]string{}
		for key, value := range cfg.Public {
			clientEnv[toCamel(strings.TrimPrefix(key, "PUBLIC_"))] = value
		}

		payload, err := json.MarshalIndent(clientEnv, "", "  ")
		if err != nil {
			http.Error(w, "could not render env", http.StatusInternalServerError)
			return
		}

		_, _ = w.Write([]byte("window.ENV = "))
		_, _ = w.Write(payload)
		_, _ = w.Write([]byte(";\n"))
	}
}

func toCamel(input string) string {
	input = strings.ToLower(input)
	parts := strings.Split(input, "_")
	if len(parts) == 0 {
		return input
	}
	for i := 1; i < len(parts); i++ {
		if parts[i] == "" {
			continue
		}
		parts[i] = strings.ToUpper(parts[i][:1]) + parts[i][1:]
	}
	return strings.Join(parts, "")
}
