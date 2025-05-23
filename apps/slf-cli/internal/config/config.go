package config

import (
	"errors"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v2"
)

type Config struct {
	Token     string `yaml:"token"`
	ServerURL string `yaml:"serverUrl"`
}

func getConfigPath() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		panic("cannot determine home directory: " + err.Error())
	}
	return filepath.Join(homeDir, ".selfgrok", "config.yaml")
}

func Load() (*Config, error) {
	path := getConfigPath()

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

func Validate() error {
	cfg, err := Load()
	if err != nil {
		return err
	}

	if cfg.Token == "" {
		return errors.New("token is not set in config")
	}
	if cfg.ServerURL == "" {
		return errors.New("server URL is not set in config")
	}

	return nil
}

func MustLoad() *Config {
	cfg, err := Load()
	if err != nil {
		println("❌ failed to load config:", err.Error())
		os.Exit(1)
	}
	return cfg
}
