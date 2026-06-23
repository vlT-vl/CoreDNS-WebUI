package main

import (
	"encoding/json"
	"io"
)

func jsonNewEncoder(w io.Writer) *json.Encoder {
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(true)
	return enc
}
