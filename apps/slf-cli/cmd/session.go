package cmd

import (
	"cli/internal/session"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/spf13/cobra"
)

var Host string
var Port string

var sessionCmd = &cobra.Command{
	Use:     "session",
	Short:   "create a session",
	Long:    "creates a session for expose port to internet",
	Example: "selfgrok session --host <host> --port <port>",
	Run: func(cmd *cobra.Command, args []string) {
		if Port == "" {
			fmt.Println("Please provide port for expose")
			return
		}

		stop := make(chan os.Signal, 1)
		signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

		done := make(chan struct{})

		go func() {
			err := session.Start(Host, Port)
			if err != nil {
				fmt.Println("Session ended with error:", err)
			} else {
				fmt.Println("Session interrupted by server")
			}
			close(done)
		}()

		select {
		case <-stop:
			fmt.Println("\nSession interrupted by user.")

		case <-done:
			fmt.Println("Session ended.")
		}

		fmt.Println("Session created successfully")
	},
}

func init() {
	sessionCmd.Flags().StringVar(&Host, "host", "127.0.0.1", "Set host (default: 127.0.0.1)")
	sessionCmd.Flags().StringVar(&Port, "port", "", "Set port")
	rootCmd.AddCommand(sessionCmd)
}
