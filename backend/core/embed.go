//go:build !dev

package main

import (
	"io/fs"
	"net/http"

	frontend "go-react-vite-template/web"
)

func frontendFileSystem(_ Config) (http.FileSystem, error) {
	dist, err := fs.Sub(frontend.DistFS, "dist")
	if err != nil {
		return nil, err
	}
	return http.FS(dist), nil
}
