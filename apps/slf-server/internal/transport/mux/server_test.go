package mux_test

import (
	"bytes"
	"io"
	"net"
	"sync"
	"testing"
	"time"

	"srv/internal/transport/frame"
	"srv/internal/transport/mux"
)

type mockConn struct {
	io.Reader
	io.Writer
	closed bool
	mu     sync.Mutex
}

func (c *mockConn) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.closed = true
	return nil
}

func (c *mockConn) LocalAddr() net.Addr                { return nil }
func (c *mockConn) RemoteAddr() net.Addr               { return nil }
func (c *mockConn) SetDeadline(t time.Time) error      { return nil }
func (c *mockConn) SetReadDeadline(t time.Time) error  { return nil }
func (c *mockConn) SetWriteDeadline(t time.Time) error { return nil }

func TestServerAddExternalConn(t *testing.T) {
	r, _ := io.Pipe()
	internal := &mockConn{Reader: r, Writer: io.Discard}
	server := mux.NewServer(internal)
	server.Start()

	extReader, _ := io.Pipe()
	extConn := &mockConn{Reader: extReader, Writer: io.Discard}

	server.AddExternalConn(extConn)

	select {
	case <-time.After(1 * time.Second):
		// We expect no panic and server to handle input
	}
}

func TestServerSetInternalConn(t *testing.T) {
	r1, w1 := io.Pipe()
	conn1 := &mockConn{Reader: r1, Writer: io.Discard}

	server := mux.NewServer(conn1)
	server.Start()

	r2, w2 := io.Pipe()
	conn2 := &mockConn{Reader: r2, Writer: io.Discard}
	server.SetInternalConn(conn2)

	if server == nil {
		t.Fatal("server should not be nil")
	}

	_ = w1.Close()
	_ = w2.Close()
}

func TestFrameWriteAndRead(t *testing.T) {
	var buf bytes.Buffer

	f := &frame.Frame{
		Type:     frame.TypeData,
		StreamID: 1234,
		Length:   4,
		Payload:  []byte("test"),
	}

	if err := frame.WriteFrame(&buf, f); err != nil {
		t.Fatalf("failed to write frame: %v", err)
	}

	out, err := frame.ReadFrame(&buf)
	if err != nil {
		t.Fatalf("failed to read frame: %v", err)
	}

	if out.Type != f.Type || out.StreamID != f.StreamID || out.Length != f.Length || string(out.Payload) != string(f.Payload) {
		t.Errorf("frame mismatch: got %+v, want %+v", out, f)
	}
}
