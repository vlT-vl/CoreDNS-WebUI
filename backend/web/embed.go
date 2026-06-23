package web

import "embed"

// DistFS contains the compiled React/Vite frontend.
// build.sh copies frontend/dist into backend/web/dist before building Go.
//
//go:embed dist/*
var DistFS embed.FS
