package frame

import (
	"encoding/binary"
	"fmt"
	"io"
)

const (
	TypeConnect = 1
	TypeData    = 2
	TypeClose   = 3
)

type Frame struct {
	Type     byte
	StreamID uint32
	Length   uint32
	Payload  []byte
}

func ReadFrame(r io.Reader) (*Frame, error) {
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

func WriteFrame(w io.Writer, f *Frame) error {
	header := make([]byte, 9)
	header[0] = f.Type
	binary.BigEndian.PutUint32(header[1:5], f.StreamID)
	binary.BigEndian.PutUint32(header[5:9], f.Length)

	if _, err := w.Write(header); err != nil {
		return err
	}
	if f.Length > 0 && f.Payload != nil {
		if _, err := w.Write(f.Payload); err != nil {
			return err
		}
	}
	return nil
}

func Stringify(f *Frame) string {
	return fmt.Sprintf("Frame{Type:%d StreamID:%d Length:%d}", f.Type, f.StreamID, f.Length)
}
