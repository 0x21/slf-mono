package tcp_test

import (
	"fmt"
	"io"
	"net"
	"testing"
	"time"

	"srv/internal/transport/tcp"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func startEchoServer(t *testing.T, port int) net.Listener {
	ln, err := net.Listen("tcp", fmt.Sprintf(":%d", port))

	require.NoError(t, err)

	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			go func(c net.Conn) {
				defer c.Close()
				io.Copy(c, c)
			}(conn)
		}
	}()

	return ln
}

func TestTCPProxy_BasicDataTransfer(t *testing.T) {
	extPort := 3002
	intPort := 3003

	echo := startEchoServer(t, intPort)
	defer echo.Close()

	proxy := tcp.NewTCPProxy(extPort, intPort)
	err := proxy.Start(func(extConn, intConn net.Conn) {
		go tcp.Pipe(extConn, intConn, "test handler ext->int")
		go tcp.Pipe(intConn, extConn, "test handler int->ext")
	})
	require.NoError(t, err)
	defer proxy.Stop()

	time.Sleep(100 * time.Millisecond) // Let servers settle

	client, err := net.Dial("tcp", ":9001")
	require.NoError(t, err)
	defer client.Close()

	message := "Hello Proxy!"
	_, err = client.Write([]byte(message))
	require.NoError(t, err)

	buf := make([]byte, 1024)
	n, err := client.Read(buf)
	require.NoError(t, err)
	assert.Equal(t, message, string(buf[:n]))
}

func TestTCPProxy_TimeoutOnNoInternal(t *testing.T) {
	extPort := 9011
	intPort := 9012

	proxy := tcp.NewTCPProxy(extPort, intPort)
	err := proxy.Start(func(extConn, intConn net.Conn) {
		// won't be called in this test
	})
	require.NoError(t, err)
	defer proxy.Stop()

	time.Sleep(100 * time.Millisecond)

	client, err := net.Dial("tcp", ":9011")
	require.NoError(t, err)
	defer client.Close()

	_, err = client.Write([]byte("should fail"))
	assert.NoError(t, err)

	buf := make([]byte, 1024)
	client.SetReadDeadline(time.Now().Add(11 * time.Second))
	_, err = client.Read(buf)
	assert.Error(t, err)
}
