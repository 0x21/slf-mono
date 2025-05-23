package kafka

import (
	"context"
	"encoding/json"
	"log"
	"srv/internal/session"

	kafkago "github.com/segmentio/kafka-go"
)

type KafkaConsumer struct {
	reader  *kafkago.Reader
	manager *session.Manager
}

type SessionMessage struct {
	Type         string `json:"type"` // start | stop
	SessionID    string `json:"sessionId"`
	Address      string `json:"address"`
	ExternalPort int    `json:"externalPort,omitempty"`
	InternalPort int    `json:"internalPort,omitempty"`
}

func NewKafkaConsumer(brokers []string, topic string, manager *session.Manager) *KafkaConsumer {
	r := kafkago.NewReader(kafkago.ReaderConfig{
		Brokers:  brokers,
		Topic:    topic,
		GroupID:  "proxy-server-group",
		MinBytes: 10e2,
		MaxBytes: 10e6,
	})
	return &KafkaConsumer{
		reader:  r,
		manager: manager,
	}
}

func (kc *KafkaConsumer) Start() error {
	defer kc.reader.Close()
	log.Println("[kafka] consumer started")

	for {
		msg, err := kc.reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("[kafka] read error: %v", err)
			continue
		}

		var m SessionMessage
		if err := json.Unmarshal(msg.Value, &m); err != nil {
			log.Printf("[kafka] invalid message: %v", err)
			continue
		}

		switch m.Type {
		case "start":
			log.Printf("[kafka] starting session: %s", m.SessionID)
			go kc.manager.StartSession(m.SessionID, m.ExternalPort, m.InternalPort)
		case "stop":
			log.Printf("[kafka] stopping session: %s", m.SessionID)
			kc.manager.StopSession(m.SessionID)
		default:
			log.Printf("[kafka] unknown message type: %s", m.Type)
		}
	}
}
