package cmd

import (
	"cli/internal/config"
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:     "selfgrok",
	Short:   "your selfhosted ngrok",
	Long:    "selfgrok, selfhosted ngrok",
	Example: "selfgrok --help",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("\n Use \"selfgrok --help\" to see available commands.")
	},

	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		printBanner()
		if cmd.Name() == "help" || cmd.Name() == "config" {
			return
		}

		err := config.Validate()
		if err != nil {
			fmt.Println("Token is not set. Please run: selfgrok config --setToken <your_token>")
			os.Exit(1)
		}
	},
}

func Execute() {
	cobra.CheckErr(rootCmd.Execute())
}

func init() {
	rootCmd.PersistentFlags().StringP("config", "c", "", "config file path")
}

func printBanner() {
	fmt.Println(`
╔═════════════════════════════════════╗
║         SelfGrok CLI v0.1           ║
║ self-hosted ngrok alternative       ║
╚═════════════════════════════════════╝`)
}
