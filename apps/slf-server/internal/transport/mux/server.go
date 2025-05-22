package mux

import (
	"io"
	"log"
	"math/rand"
	"net"
	"sync"

	"srv/internal/transport/frame"
)

type Server struct {
	internal    net.Conn
	internalMu   sync.Mutex
	streams     map[uint32]net.Conn
	mu          sync.RWMutex
	restarted    bool
	newExternal chan net.Conn
	quit        chan struct{}
}

func NewServer(internal net.Conn) *Server {
	return &Server{
		internal:    internal,
		streams:     make(map[uint32]net.Conn),
		newExternal: make(chan net.Conn, 100),
		quit:        make(chan struct{}),
	}
}

func (s *Server) Start() {
	go s.handleInternalRead()
	go s.handleExternalAccept()
}

func (s *Server) AddExternalConn(conn net.Conn) {
	s.newExternal <- conn
}

func (s *Server) Stop() {
	close(s.quit)
	s.internal.Close()
	s.mu.Lock()
	for _, c := range s.streams {
		c.Close()
	}
	s.mu.Unlock()
	log.Println("[mux] server stopped")
}

func (s *Server) handleExternalAccept() {
	for {
		select {
		case <-s.quit:
			return
		case conn := <-s.newExternal:
			streamID := rand.Uint32()
			s.mu.Lock()
			s.streams[streamID] = conn
			s.mu.Unlock()

			log.Printf("[mux] accepted external streamID=%d", streamID)

			err := frame.WriteFrame(s.internal, &frame.Frame{
				Type:     frame.TypeConnect,
				StreamID: streamID,
			})
			if err != nil {
				log.Printf("[mux] failed to write CONNECT frame: %v", err)
			}

			go s.pipeToInternal(streamID, conn)
		}
	}
}

func (s *Server) pipeToInternal(streamID uint32, conn net.Conn) {
	pr, pw := net.Pipe()
	go func() {
		_, err := io.Copy(pw, conn)
		pw.Close()
		if err != nil {
			log.Printf("[mux] io.Copy error for stream %d: %v", streamID, err)
		}
	}()

	buf := make([]byte, 4096)
	for {
		n, err := pr.Read(buf)
		if err != nil {
			break
		}
		err = frame.WriteFrame(s.internal, &frame.Frame{
			Type:     frame.TypeData,
			StreamID: streamID,
			Length:   uint32(n),
			Payload:  buf[:n],
		})
		if err != nil {
			log.Printf("[mux] failed to write frame for stream %d: %v", streamID, err)
			break
		}
		log.Printf("[mux] wrote %d bytes from external to internal for stream %d", n, streamID)
	}

	err := frame.WriteFrame(s.internal, &frame.Frame{
		Type:     frame.TypeClose,
		StreamID: streamID,
	})
	if err != nil {
		log.Printf("[mux] failed to write CLOSE frame: %v", err)
	}

	s.mu.Lock()
	delete(s.streams, streamID)
	s.mu.Unlock()
	conn.Close()
}

func (s *Server) handleInternalRead() {
	for {
		select {
		case <-s.quit:
			log.Println("[mux] internal read stopped")
			return
		default:
			f, err := frame.ReadFrame(s.internal)
			if err != nil {
				log.Printf("[mux] internal read error: %v", err)
				s.Stop()
				return
			}

			log.Printf("[mux] got frame: type=%d streamID=%d length=%d", f.Type, f.StreamID, f.Length)

			s.mu.RLock()
			conn, ok := s.streams[f.StreamID]
			s.mu.RUnlock()

			if !ok {
				log.Printf("[mux] unknown stream id %d", f.StreamID)
				continue
			}

			switch f.Type {
			case frame.TypeData:
				n, err := conn.Write(f.Payload)
				if err != nil {
					log.Printf("[mux] stream %d write to external failed: %v", f.StreamID, err)
				} else {
					log.Printf("[mux] wrote %d bytes to stream %d", n, f.StreamID)
				}
			case frame.TypeClose:
				s.mu.Lock()
				delete(s.streams, f.StreamID)
				s.mu.Unlock()
				conn.Close()
				log.Printf("[mux] stream %d closed by internal", f.StreamID)
			}
		}
	}
}


func (s *Server) SetInternalConn(conn net.Conn) {
	s.internalMu.Lock()
	defer s.internalMu.Unlock()

	if s.internal != nil {
		log.Println("[mux] closing old internal connection")
		s.internal.Close()
	}

	s.internal = conn
	s.restarted = true

	log.Println("[mux] internal connection reset, restarting handler")
	go s.handleInternalRead()
}