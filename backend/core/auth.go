package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

const (
	sessionCookie   = "coredns_session"
	sessionDuration = 24 * time.Hour
)

// sessionStore is an in-memory store of valid session tokens.
type sessionStore struct {
	mu   sync.RWMutex
	data map[string]time.Time
}

var sessions = &sessionStore{data: make(map[string]time.Time)}

func (s *sessionStore) create() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	token := hex.EncodeToString(b)
	s.mu.Lock()
	s.data[token] = time.Now().Add(sessionDuration)
	s.mu.Unlock()
	return token
}

func (s *sessionStore) valid(token string) bool {
	s.mu.RLock()
	exp, ok := s.data[token]
	s.mu.RUnlock()
	return ok && time.Now().Before(exp)
}

func (s *sessionStore) delete(token string) {
	s.mu.Lock()
	delete(s.data, token)
	s.mu.Unlock()
}

// POST /api/login — verifica credenziali server-side e imposta cookie httpOnly
func loginHandler(cfg Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			User string `json:"user"`
			Pass string `json:"pass"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "error": "richiesta non valida"})
			return
		}
		if body.User != cfg.AdminUser || body.Pass != cfg.AdminPass {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"ok": false, "error": "credenziali non valide"})
			return
		}
		token := sessions.create()
		http.SetCookie(w, &http.Cookie{
			Name:     sessionCookie,
			Value:    token,
			Path:     "/",
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
			MaxAge:   int(sessionDuration.Seconds()),
		})
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})
	}
}

// POST /api/logout — invalida la sessione e cancella il cookie
func logoutHandler(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(sessionCookie); err == nil {
		sessions.delete(c.Value)
	}
	http.SetCookie(w, &http.Cookie{
		Name:   sessionCookie,
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// GET /api/auth/status — il frontend lo chiama all'avvio per sapere se c'è già una sessione
func authStatusHandler(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie(sessionCookie)
	authed := err == nil && sessions.valid(c.Value)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "authed": authed})
}

// requireAuth è un middleware che blocca le richieste senza sessione valida.
// Se AUTH_ENABLED=false passa tutto senza controllo.
func requireAuth(cfg Config, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !cfg.AuthEnabled {
			next.ServeHTTP(w, r)
			return
		}
		c, err := r.Cookie(sessionCookie)
		if err != nil || !sessions.valid(c.Value) {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"ok": false, "error": "sessione non valida"})
			return
		}
		next.ServeHTTP(w, r)
	})
}
