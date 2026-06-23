//go:build !dev

package web

import _ "embed"

// EnvBytes contiene il .env baked nel binario.
// build.sh copia root/.env → backend/web/.env prima del build e lo rimuove dopo.
//
//go:embed .env
var EnvBytes []byte
