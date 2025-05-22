package app

import (
	"log"
	"srv/internal/config"
	"srv/internal/kafka"
	"srv/internal/session"
)

type Server struct {
	cfg      *config.Config
	manager  *session.Manager
	consumer *kafka.KafkaConsumer
}

func NewServer(cfg *config.Config) *Server {
	reg := session.NewRegistry()
	manager := session.NewManager(reg)
	consumer := kafka.NewKafkaConsumer(cfg.KafkaBrokers, cfg.KafkaTopic, manager)

	return &Server{
		cfg:      cfg,
		manager:  manager,
		consumer: consumer,
	}
}

func (s *Server) Start() error {
	log.Println("[app] starting server...")
	return s.consumer.Start()
}
