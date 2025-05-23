package frame_test

import (
	"bytes"
	"testing"

	"srv/internal/transport/frame"
)

func TestWriteAndReadFrame(t *testing.T) {
	original := &frame.Frame{
		Type:     frame.TypeData,
		StreamID: 1234,
		Length:   5,
		Payload:  []byte("hello"),
	}

	buf := new(bytes.Buffer)
	err := frame.WriteFrame(buf, original)
	if err != nil {
		t.Fatalf("WriteFrame failed: %v", err)
	}

	read, err := frame.ReadFrame(buf)
	if err != nil {
		t.Fatalf("ReadFrame failed: %v", err)
	}

	if read.Type != original.Type ||
		read.StreamID != original.StreamID ||
		read.Length != original.Length ||
		string(read.Payload) != string(original.Payload) {
		t.Errorf("Frame mismatch. Got %+v, expected %+v", read, original)
	}
}

func TestReadFrameIncompleteHeader(t *testing.T) {
	buf := bytes.NewBuffer([]byte{0x01, 0x00})
	_, err := frame.ReadFrame(buf)
	if err == nil {
		t.Fatal("Expected error due to incomplete header, got nil")
	}
}

func TestReadFrameIncompletePayload(t *testing.T) {
	buf := new(bytes.Buffer)
	frame.WriteFrame(buf, &frame.Frame{
		Type:     frame.TypeData,
		StreamID: 1,
		Length:   10,
		Payload:  []byte("short"),
	})

	broken := buf.Bytes()
	broken = broken[:len(broken)-2] // simulate incomplete payload
	_, err := frame.ReadFrame(bytes.NewReader(broken))
	if err == nil {
		t.Fatal("Expected error due to incomplete payload, got nil")
	}
}

func TestWriteFrameWithNilPayload(t *testing.T) {
	buf := new(bytes.Buffer)
	err := frame.WriteFrame(buf, &frame.Frame{
		Type:     frame.TypeData,
		StreamID: 1,
		Length:   0,
		Payload:  nil,
	})
	if err != nil {
		t.Fatalf("Expected no error writing frame with nil payload: %v", err)
	}
}

func TestStringify(t *testing.T) {
	f := &frame.Frame{
		Type:     frame.TypeConnect,
		StreamID: 42,
		Length:   0,
	}
	expected := "Frame{Type:1 StreamID:42 Length:0}"
	if frame.Stringify(f) != expected {
		t.Errorf("Expected %q, got %q", expected, frame.Stringify(f))
	}
}
