//go:build dev

package web

// Dev: nessun embed, config letta da disco tramite loadEnvFile().
var EnvBytes []byte
