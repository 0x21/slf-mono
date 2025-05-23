package api

import (
	"bytes"
	"cli/internal/config"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Client struct {
	baseURL string
	token   string
}

func New() (*Client, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("config load error: %w", err)
	}
	if cfg.Token == "" || cfg.ServerURL == "" {
		return nil, fmt.Errorf("token or server URL not set in config")
	}

	return &Client{
		baseURL: cfg.ServerURL,
		token:   cfg.Token,
	}, nil
}

func (c *Client) DoRequest(method, path string, body any) (*http.Response, error) {
	var buf io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to encode body: %w", err)
		}
		buf = bytes.NewBuffer(b)
	}

	req, err := http.NewRequest(method, c.baseURL+path, buf)
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-api-key", c.token)
	req.Header.Set("Content-Type", "application/json")

	client := http.DefaultClient
	return client.Do(req)
}
