package session

import (
	"cli/internal/api"
	"cli/internal/connector"
	"fmt"
	"os"
	"os/signal"
	"syscall"
)

func Start(host, port string) error {
	client, err := api.New()
	if err != nil {
		return fmt.Errorf("API client init failed: %w", err)
	}
	fmt.Println("\nAPI client initialized")
	fmt.Println("\nCreating session...")

	conn, err := client.CreateConnection()
	if err != nil {
		return fmt.Errorf("connection create failed: %w", err)
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	localTarget := fmt.Sprintf("%s:%s", host, port)

	go func() {
		<-stop
		fmt.Println("\nShutting down session...")
		_ = client.DeleteConnection(conn.ID)
		os.Exit(0)
	}()

	err = connector.ConnectAndRun(localTarget, client, conn)
	if err != nil {
		fmt.Println("Connector run failed:", err)
		_ = client.DeleteConnection(conn.ID)
		return fmt.Errorf("connector run failed: %w", err)
	}

	_ = client.DeleteConnection(conn.ID)
	return fmt.Errorf("connector start failed: %w", err)

}
