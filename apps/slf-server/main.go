package main

import (
	"fmt"
	"log"
	"net"
	"sync/atomic"
	"time"
)

var (
	externalPort = 8080
	internalPort = 9000
	connID       int32
)

func main() {
	extListener, err := net.Listen("tcp", fmt.Sprintf(":%d", externalPort))
	if err != nil {
		log.Fatalf("failed to listen on external port: %v", err)
	}
	defer extListener.Close()

	intListener, err := net.Listen("tcp", fmt.Sprintf(":%d", internalPort))
	if err != nil {
		log.Fatalf("failed to listen on internal port: %v", err)
	}
	defer intListener.Close()

	log.Printf("listening on external :%d and internal :%d", externalPort, internalPort)

	extChan := make(chan net.Conn, 50)
	intChan := make(chan net.Conn, 50)

	go acceptConnections(extListener, extChan, "external")
	go acceptConnections(intListener, intChan, "internal")

	for {
		extConn := <-extChan

		go func(extConn net.Conn) {
			defer extConn.Close()

			select {
			case intConn := <-intChan:
				defer intConn.Close()

				id := atomic.AddInt32(&connID, 1)
				tag := fmt.Sprintf("[conn-%d]", id)
				log.Printf("%s matched external %s <-> internal %s", tag, extConn.RemoteAddr(), intConn.RemoteAddr())

				go proxyPipe(extConn, intConn, tag+" ext→int")
				proxyPipe(intConn, extConn, tag+" int→ext")
			case <-time.After(10 * time.Second):
				log.Printf("timeout waiting for internal connection for %s", extConn.RemoteAddr())
			}
		}(extConn)
	}
}

func acceptConnections(listener net.Listener, ch chan net.Conn, label string) {
	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("[%s] accept error: %v", label, err)
			continue
		}
		log.Printf("[%s] accepted: %s", label, conn.RemoteAddr())
		ch <- conn
	}
}

func proxyPipe(src, dst net.Conn, tag string) {
	buf := make([]byte, 4096)
	for {
		_ = src.SetReadDeadline(time.Now().Add(15 * time.Second))
		n, err := src.Read(buf)
		if err != nil {
			log.Printf("%s read error: %v", tag, err)
			break
		}
		log.Printf("%s forwarding %d bytes", tag, n)
		_, err = dst.Write(buf[:n])
		if err != nil {
			log.Printf("%s write error: %v", tag, err)
			break
		}
	}
}
