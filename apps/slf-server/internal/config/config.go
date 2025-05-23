package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	KafkaBrokers []string
	KafkaTopic   string
}

func Load() *Config {

	// Load environment variables
	if os.Getenv("ENV") != "Prod" {
		err := godotenv.Load()
		if err != nil {
			log.Fatal("Error loading .env file")
		}
	}

	return &Config{
		KafkaBrokers: []string{os.Getenv("KAFKA_URL")},
		KafkaTopic:   "connection",
	}
}
