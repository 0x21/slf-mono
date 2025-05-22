package session

import (
	"log"
	"sync"
)

type Registry struct {
	sessions map[string]*Session
	mu       sync.RWMutex
}

func NewRegistry() *Registry {
	return &Registry{
		sessions: make(map[string]*Session),
	}
}

func (r *Registry) Add(s *Session) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.sessions[s.ID]; exists {
		log.Printf("[registry] session %s already exists", s.ID)
		return
	}
	r.sessions[s.ID] = s
}

func (r *Registry) Get(id string) (*Session, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.sessions[id]
	return s, ok
}

func (r *Registry) Remove(id string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.sessions, id)
}

func (r *Registry) All() []*Session {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var all []*Session
	for _, s := range r.sessions {
		all = append(all, s)
	}
	return all
}
