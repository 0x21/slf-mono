package main

import (
	"encoding/binary"
	"fmt"
	"io"
	"log"
	"net"
	"sync"
	"time"
)

const (
	frameTypeConnect = 1
	frameTypeData    = 2
	frameTypeClose   = 3
)

var (
	serverAddr  = "127.0.0.1:9001"
	localTarget = "localhost:3000"
)

type Frame struct {
	Type     byte
	StreamID uint32
	Length   uint32
	Payload  []byte
}

type stream struct {
	conn  net.Conn
	mu    sync.Mutex
	ready chan struct{}
}

func main() {
	for {
		err := connectAndRun()
		log.Printf("connection loop ended: %v", err)
		time.Sleep(1 * time.Second)
	}
}

func connectAndRun() error {
	serverConn, err := net.Dial("tcp", serverAddr)
	if err != nil {
		return fmt.Errorf("failed to connect to server: %w", err)
	}
	defer serverConn.Close()

	log.Printf("connected to server at %s", serverAddr)

	streams := make(map[uint32]*stream)
	var mu sync.RWMutex
	writeQueue := make(chan *Frame, 1000)

	go writeLoop(serverConn, writeQueue)

	go func() {
		for {
			f, err := readFrame(serverConn)
			if err != nil {
				log.Printf("[readFrame] error: %v", err)
				break
			}

			log.Printf("[client] got frame: type=%d streamID=%d length=%d", f.Type, f.StreamID, f.Length)

			switch f.Type {
			case frameTypeConnect:
				log.Printf("[connect] new streamID %d", f.StreamID)
				go handleConnect(f.StreamID, streams, &mu, writeQueue)

			case frameTypeData:
				mu.RLock()
				str, ok := streams[f.StreamID]
				mu.RUnlock()
				if !ok {
					time.Sleep(10 * time.Millisecond)
					mu.RLock()
					str, ok = streams[f.StreamID]
					mu.RUnlock()
				}
				if ok {
					<-str.ready
					str.mu.Lock()
					n, err := str.conn.Write(f.Payload)
					str.mu.Unlock()
					if err != nil {
						log.Printf("[data] stream %d write error: %v", f.StreamID, err)
					} else {
						log.Printf("[data] wrote %d bytes to local service for stream %d", n, f.StreamID)
					}
				} else {
					log.Printf("[data] stream %d not found", f.StreamID)
				}

			case frameTypeClose:
				mu.Lock()
				if str, ok := streams[f.StreamID]; ok {
					<-str.ready
					if str.conn != nil {
						str.conn.Close()
					}
					delete(streams, f.StreamID)
					log.Printf("[close] stream %d closed by server", f.StreamID)
				}
				mu.Unlock()

			default:
				log.Printf("unknown frame type: %d", f.Type)
			}
		}
	}()

	select {}
}

func handleConnect(streamID uint32, streams map[uint32]*stream, mu *sync.RWMutex, writeQueue chan *Frame) {
	str := &stream{ready: make(chan struct{})}
	mu.Lock()
	streams[streamID] = str
	mu.Unlock()

	localConn, err := net.Dial("tcp", localTarget)
	if err != nil {
		log.Printf("failed to connect to local service: %v", err)
		writeQueue <- &Frame{Type: frameTypeClose, StreamID: streamID}
		mu.Lock()
		delete(streams, streamID)
		mu.Unlock()
		return
	}

	str.conn = localConn
	close(str.ready)
	log.Printf("connected stream %d to local %s", streamID, localTarget)

	buf := make([]byte, 4096)
	for {
		n, err := localConn.Read(buf)
		if err != nil {
			log.Printf("[local→server] stream %d read error: %v", streamID, err)
			break
		}

		copyBuf := make([]byte, n)
		copy(copyBuf, buf[:n])
		writeQueue <- &Frame{
			Type:     frameTypeData,
			StreamID: streamID,
			Payload:  copyBuf,
			Length:   uint32(n),
		}
		log.Printf("[writeFrame] queued %d bytes to server for stream %d", n, streamID)
	}

	writeQueue <- &Frame{Type: frameTypeClose, StreamID: streamID}
	localConn.Close()

	mu.Lock()
	delete(streams, streamID)
	mu.Unlock()
	log.Printf("closed stream %d (from local)", streamID)
}

func writeLoop(w io.Writer, queue <-chan *Frame) {
	for f := range queue {
		err := writeFrame(w, f.Type, f.StreamID, f.Payload)
		if err != nil {
			log.Printf("[writeLoop] error writing frame: %v", err)
			return
		}
	}
}

func readFrame(r io.Reader) (*Frame, error) {
	header := make([]byte, 9)
	if _, err := io.ReadFull(r, header); err != nil {
		return nil, err
	}

	f := &Frame{
		Type:     header[0],
		StreamID: binary.BigEndian.Uint32(header[1:5]),
		Length:   binary.BigEndian.Uint32(header[5:9]),
	}

	if f.Length > 0 {
		f.Payload = make([]byte, f.Length)
		if _, err := io.ReadFull(r, f.Payload); err != nil {
			return nil, err
		}
	}

	return f, nil
}

func writeFrame(w io.Writer, fType byte, streamID uint32, payload []byte) error {
	length := uint32(len(payload))
	header := make([]byte, 9)
	header[0] = fType
	binary.BigEndian.PutUint32(header[1:5], streamID)
	binary.BigEndian.PutUint32(header[5:9], length)

	if _, err := w.Write(header); err != nil {
		return err
	}
	if length > 0 {
		_, err := w.Write(payload)
		return err
	}
	return nil
}