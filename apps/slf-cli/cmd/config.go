package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
	"gopkg.in/yaml.v2"
)

var setToken string
var setServerUrl string

type Config struct {
	Token     string `yaml:"token"`
	ServerURL string `yaml:"serverUrl"`
}

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Define configs for selfgrok",
	Run: func(cmd *cobra.Command, args []string) {
		configPath := getConfigPath()
		cfg := Config{}

		_ = os.MkdirAll(filepath.Dir(configPath), os.ModePerm)
		if data, err := os.ReadFile(configPath); err == nil {
			_ = yaml.Unmarshal(data, &cfg)
		}

		if setToken == "" && setServerUrl == "" {
			printConfig(cfg)
			return
		}

		if setToken != "" {
			cfg.Token = setToken
		}
		if setServerUrl != "" {
			cfg.ServerURL = setServerUrl
		}

		file, err := os.Create(configPath)
		if err != nil {
			fmt.Println("Cannot create config file:", err)
			return
		}
		defer file.Close()

		encoder := yaml.NewEncoder(file)
		defer encoder.Close()
		if err := encoder.Encode(cfg); err != nil {
			fmt.Println("Config writing error:", err)
			return
		}

		fmt.Println("Config saved successfully.")
	},
}

func init() {
	configCmd.Flags().StringVar(&setToken, "setToken", "", "Set API token")
	configCmd.Flags().StringVar(&setServerUrl, "setServerUrl", "", "Set server URL")
	rootCmd.AddCommand(configCmd)
}

func getConfigPath() string {
	homeDir, _ := os.UserHomeDir()
	return filepath.Join(homeDir, ".selfgrok", "config.yaml")
}

func printConfig(cfg Config) {
	fmt.Println("Current configuration:")
	pairs := map[string]string{
		"Token":     cfg.Token,
		"ServerURL": cfg.ServerURL,
	}

	maxKeyLen := 0
	for k := range pairs {
		if len(k) > maxKeyLen {
			maxKeyLen = len(k)
		}
	}

	for k, v := range pairs {
		paddedKey := k + strings.Repeat(" ", maxKeyLen-len(k))
		if v == "" {
			fmt.Printf("  %s : (not set)\n", paddedKey)
		} else {
			fmt.Printf("  %s : %s\n", paddedKey, v)
		}
	}
}
