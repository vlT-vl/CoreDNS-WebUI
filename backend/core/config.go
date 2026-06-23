package main

import (
	"bufio"
	"bytes"
	"log"
	"os"
	"strings"

	frontend "go-react-vite-template/web"
)

type Config struct {
	Port        string
	Public      map[string]string
	BridgeURL   string
	AuthEnabled bool
	AdminUser   string
	AdminPass   string
}

func LoadConfig() Config {
	loadEnvFile()

	authEnabled := getEnv("AUTH_ENABLED", "false") == "true"

	pub := publicEnv()
	// Espone authEnabled al frontend senza mai mandare le credenziali
	if authEnabled {
		pub["PUBLIC_AUTH_ENABLED"] = "true"
	} else {
		pub["PUBLIC_AUTH_ENABLED"] = "false"
	}

	return Config{
		Port:        getEnv("PORT", "3000"),
		Public:      pub,
		BridgeURL:   getEnv("BRIDGE_URL", "http://127.0.0.1:8081"),
		AuthEnabled: authEnabled,
		AdminUser:   getEnv("ADMIN_USER", ""),
		AdminPass:   getEnv("ADMIN_PASS", ""),
	}
}

func loadEnvFile() {
	// Release: .env embedded in backend/web (offuscato da garble)
	if len(frontend.EnvBytes) > 0 {
		if err := parseDotEnvBytes(frontend.EnvBytes); err != nil {
			log.Printf("warning: could not parse embedded .env: %v", err)
		}
		return
	}
	// Dev: legge da disco
	for _, path := range []string{".env", "../.env", "../../.env"} {
		if _, err := os.Stat(path); err == nil {
			if err := parseDotEnv(path); err != nil {
				log.Printf("warning: could not load %s: %v", path, err)
			}
			return
		}
	}
}

func parseDotEnvBytes(data []byte) error {
	scanner := bufio.NewScanner(bytes.NewReader(data))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		if key != "" {
			_ = os.Setenv(key, value)
		}
	}
	return scanner.Err()
}

func publicEnv() map[string]string {
	out := make(map[string]string)
	for _, item := range os.Environ() {
		key, value, ok := strings.Cut(item, "=")
		if ok && strings.HasPrefix(key, "PUBLIC_") {
			out[key] = value
		}
	}
	return out
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseDotEnv(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		if key != "" {
			_ = os.Setenv(key, value)
		}
	}
	return scanner.Err()
}
