//go:build dev

package main

import "net/http"

func frontendFileSystem(_ Config) (http.FileSystem, error) {
	return http.Dir("web/dist"), nil
}
