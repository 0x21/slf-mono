package tcp

import (
	"fmt"
	"io"
	"log"
	"net"
	"time"
)

type Handler func(extConn net.Conn, intConn net.Conn)

type TCPProxy struct {
	ExtPort int
	IntPort int
	ext     net.Listener
	intl    net.Listener
	quit    chan struct{}
}

func NewTCPProxy(extPort, intPort int) *TCPProxy {
	return &TCPProxy{
		ExtPort: extPort,
		IntPort: intPort,
		quit:    make(chan struct{}),
	}
}

func (p *TCPProxy) Start(handler Handler) error {
	extListener, err := net.Listen("tcp", fmt.Sprintf(":%d", p.ExtPort))
	if err != nil {
		return fmt.Errorf("failed to listen on external port: %w", err)
	}

	intListener, err := net.Listen("tcp", fmt.Sprintf(":%d", p.IntPort))
	if err != nil {
		extListener.Close()
		return fmt.Errorf("failed to listen on internal port: %w", err)
	}

	p.ext = extListener
	p.intl = intListener

	go p.acceptLoop(handler)

	log.Printf("[tcp] proxy started on ext:%d <-> int:%d", p.ExtPort, p.IntPort)
	return nil
}

func (p *TCPProxy) acceptLoop(handler Handler) {
	extChan := make(chan net.Conn, 50)
	intChan := make(chan net.Conn, 50)

	go accept(p.ext, extChan, "external")
	go accept(p.intl, intChan, "internal")

	for {
		select {
		case <-p.quit:
			return
		case extConn, ok := <-extChan:
			if !ok {
				return
			}
			go func(extConn net.Conn) {
				select {
				case intConn := <-intChan:
					handler(extConn, intConn)
				case <-time.After(10 * time.Second):
					log.Printf("[tcp] timeout waiting for internalConn for ext:%s", extConn.RemoteAddr())
					extConn.Close()
				}
			}(extConn)
		}
	}
}


func accept(l net.Listener, ch chan net.Conn, label string) {
	for {
		conn, err := l.Accept()
		if err != nil {
			log.Printf("[%s] accept error: %v", label, err)
			close(ch)
			return
		}
		log.Printf("[%s] accepted: %s", label, conn.RemoteAddr())
		ch <- conn
	}
}

func (p *TCPProxy) Stop() {
	close(p.quit)
	if p.ext != nil {
		p.ext.Close()
	}
	if p.intl != nil {
		p.intl.Close()
	}
	log.Printf("[tcp] proxy stopped ext:%d <-> int:%d", p.ExtPort, p.IntPort)
}

func Pipe(src, dst net.Conn, tag string) {
	defer src.Close()
	defer dst.Close()

	n, err := io.Copy(dst, src)
	if err != nil {
		log.Printf("%s io.Copy error: %v", tag, err)
	} else {
		log.Printf("%s copied %d bytes", tag, n)
	}
}
