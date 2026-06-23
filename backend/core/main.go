package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
)

var (
	Version   = "dev"
	BuildDate = "local"
)

func main() {
	// Release only: re-exec detached e torniamo subito alla CLI
	if shouldDaemonize() && os.Getenv("_WUBUI_CHILD") == "" {
		cmd := exec.Command(os.Args[0], os.Args[1:]...)
		cmd.Stdin = nil
		cmd.Stdout = nil
		cmd.Stderr = nil
		cmd.Env = append(os.Environ(), "_WUBUI_CHILD=1")
		setDetached(cmd)
		if err := cmd.Start(); err != nil {
			log.Fatalf("avvio daemon: %v", err)
		}
		fmt.Printf("coredns-wubui %s avviato (PID %d)\n", Version, cmd.Process.Pid)
		os.Exit(0)
	}

	log.Printf("coredns-wubui %s (%s)", Version, BuildDate)
	cfg := LoadConfig()
	server, err := NewServer(cfg)
	if err != nil {
		log.Fatal(err)
	}
	log.Fatal(server.Start())
}
