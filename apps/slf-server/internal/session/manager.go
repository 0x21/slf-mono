package session

import (
	"fmt"
	"log"
	"net"
	"srv/internal/transport/mux"
)

type Manager struct {
	registry *Registry
}

func NewManager(r *Registry) *Manager {
	return &Manager{registry: r}
}

func (m *Manager) StartSession(id string, extPort, intPort int) {
	// Session zaten varsa reconnect moduna geç
	if existing, exists := m.registry.Get(id); exists {
		log.Printf("[session] session %s already exists, waiting for internal reconnect", id)
		go existing.WaitForInternalReconnect()
		return
	}

	// Internal bağlantı bekleniyor
	internalLn, err := net.Listen("tcp", fmt.Sprintf(":%d", intPort))
	if err != nil {
		log.Printf("[session] failed to listen on internal port %d: %v", intPort, err)
		return
	}
	log.Printf("[session] waiting for internal client on :%d...", intPort)

	internalConn, err := internalLn.Accept()
	if err != nil {
		log.Printf("[session] failed to accept internal connection: %v", err)
		internalLn.Close()
		return
	}
	internalLn.Close()
	log.Printf("[session] internal client connected")

	// Mux başlat
	muxServer := mux.NewServer(internalConn)
	muxServer.Start()

	// External listener
	externalLn, err := net.Listen("tcp", fmt.Sprintf(":%d", extPort))
	if err != nil {
		log.Printf("[session] failed to listen on external port %d: %v", extPort, err)
		internalConn.Close()
		return
	}

	// External bağlantıları mux'a aktarma
	go func() {
		for {
			conn, err := externalLn.Accept()
			if err != nil {
				log.Printf("[session] external accept error: %v", err)
				break
			}
			log.Printf("[session] accepted external: %s", conn.RemoteAddr())
			muxServer.AddExternalConn(conn)
		}
	}()

	// Session oluştur ve kaydet
	s := &Session{
		ID:           id,
		ExternalPort: extPort,
		InternalPort: intPort,
		ExtListener:  externalLn,
		Active:       true,
		muxServer:    muxServer,
	}
	m.registry.Add(s)

	log.Printf("[session] started session %s", id)
}

func (m *Manager) StopSession(id string) {
	s, ok := m.registry.Get(id)
	if !ok {
		log.Printf("[session] session %s not found", id)
		return
	}

	if s.ExtListener != nil {
		s.ExtListener.Close()
	}
	if s.IntListener != nil {
		s.IntListener.Close()
	}

	m.registry.Remove(id)
	log.Printf("[session] stopped session %s", id)
}
