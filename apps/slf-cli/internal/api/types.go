package api

type Connection struct {
	ID           string `json:"id"`
	Address      string `json:"address"`
	ExternalPort int    `json:"externalPort"`
	InternalPort int    `json:"internalPort"`
	Status       string `json:"status"`
}

type ConnectionResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Error   *string     `json:"error,omitempty"`
	Data    *Connection `json:"data"`
}

type GenericResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Error   *string     `json:"error,omitempty"`
	Data    interface{} `json:"data"`
}
