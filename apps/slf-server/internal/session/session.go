package session

import (
	"fmt"
	"log"
	"net"
	"srv/internal/transport/mux"
	"sync"
)

type Session struct {
	ID           string
	ExternalPort int
	InternalPort int
	ExtListener  net.Listener
	IntListener  net.Listener //optional, I'll use it later maybe.
	Active       bool
	muxServer    *mux.Server
	mu           sync.Mutex
}

func (s *Session) WaitForInternalReconnect() {
	s.mu.Lock()
	defer s.mu.Unlock()

	log.Printf("[session] waiting for internal client to reconnect on :%d...", s.InternalPort)

	internalLn, err := net.Listen("tcp", fmt.Sprintf(":%d", s.InternalPort))
	if err != nil {
		log.Printf("[session] failed to listen again on internal port %d: %v", s.InternalPort, err)
		return
	}
	defer internalLn.Close()

	internalConn, err := internalLn.Accept()
	if err != nil {
		log.Printf("[session] failed to accept new internal connection: %v", err)
		return
	}

	log.Printf("[session] internal client reconnected")

	if s.muxServer != nil {
		s.muxServer.SetInternalConn(internalConn)
	} else {
		log.Printf("[session] error: no muxServer available for session %s", s.ID)
		internalConn.Close()
	}
}