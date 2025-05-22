package main

import (
	"log"
	"srv/internal/app"
	"srv/internal/config"
)

func main() {
	cfg := config.Load()

	s := app.NewServer(cfg)
	if err := s.Start(); err != nil {
		log.Fatalf("server exited with error: %v", err)
	}
}
