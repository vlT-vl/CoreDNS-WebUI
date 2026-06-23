package main

import (
	"log"
	"net/http"
)

type Server struct {
	cfg    Config
	router http.Handler
}

func NewServer(cfg Config) (*Server, error) {
	router, err := NewRouter(cfg)
	if err != nil {
		return nil, err
	}
	return &Server{cfg: cfg, router: router}, nil
}

func (s *Server) Start() error {
	addr := ":" + s.cfg.Port
	log.Printf("server listening on http://0.0.0.0%s", addr)
	return http.ListenAndServe(addr, s.router)
}
