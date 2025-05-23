package config

type Config struct {
	KafkaBrokers []string
	KafkaTopic   string
}

func Load() *Config {
	return &Config{
		KafkaBrokers: []string{"localhost:29092"},
		KafkaTopic:   "connection",
	}
}
