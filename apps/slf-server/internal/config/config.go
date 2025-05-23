package config

import "os"

type Config struct {
	KafkaBrokers []string
	KafkaTopic   string
}

func Load() *Config {
	return &Config{
		KafkaBrokers: []string{os.Getenv("KAFKA_URL")},
		KafkaTopic:   "connection",
	}
}
