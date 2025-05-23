package api

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func (c *Client) CreateConnection() (*Connection, error) {
	res, err := c.DoRequest(http.MethodPost, "/api/connection", nil)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	var response ConnectionResponse
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode create response: %w", err)
	}

	if !response.Success || response.Data == nil {
		return nil, formatAPIError(response.Message, response.Error)
	}

	return response.Data, nil
}

func (c *Client) UpdateConnection(id string) error {
	res, err := c.DoRequest(http.MethodPatch, "/api/connection/"+id, nil)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	var response GenericResponse
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		return fmt.Errorf("failed to decode update response: %w", err)
	}

	if !response.Success {
		return formatAPIError(response.Message, response.Error)
	}

	return nil
}

func (c *Client) DeleteConnection(id string) error {
	res, err := c.DoRequest(http.MethodDelete, "/api/connection/"+id, nil)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	var response GenericResponse
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		return fmt.Errorf("failed to decode delete response: %w", err)
	}

	if !response.Success {
		return formatAPIError(response.Message, response.Error)
	}

	return nil
}

func formatAPIError(message string, apiErr *string) error {
	if apiErr != nil {
		return fmt.Errorf("%s (%s)", message, *apiErr)
	}
	return fmt.Errorf("%s", message)
}
