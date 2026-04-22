package limiter

import (
	"sync"
	"sync/atomic"
	"time"
)

// https://stackoverflow.com/a/72452542

func NewAnilistLimiter() *Limiter {
	//return NewLimiter(15*time.Second, 18)
	return NewLimiter(6*time.Second, 8)
}

//----------------------------------------------------------------------------------------------------------------------

type Limiter struct {
	tick       time.Duration
	count      uint
	entries    []int64 // Unix nanoseconds, atomic operations
	index      atomic.Uint32
	mu         sync.Mutex
	lastCleanup int64
}

func NewLimiter(tick time.Duration, count uint) *Limiter {
	l := Limiter{
		tick:  tick,
		count: count,
	}
	l.entries = make([]int64, count)
	before := time.Now().Add(-2 * tick).UnixNano()
	for i := range l.entries {
		l.entries[i] = before
	}
	l.lastCleanup = time.Now().UnixNano()
	return &l
}

func (l *Limiter) Wait() {
	// Fast path: acquire slot without lock by trying a few times
	now := time.Now()
	nowNano := now.UnixNano()
	tickNano := l.tick.Nanoseconds()

	// Try to find an available slot without locking
	startIdx := l.index.Load()
	for attempt := uint32(0); attempt < uint32(l.count); attempt++ {
		idx := (startIdx + attempt) % uint32(l.count)
		lastNano := atomic.LoadInt64(&l.entries[idx])
		nextNano := lastNano + tickNano

		if nowNano >= nextNano {
			// Slot is available, try to claim it atomically
			if atomic.CompareAndSwapInt64(&l.entries[idx], lastNano, nowNano) {
				l.index.Store((idx + 1) % uint32(l.count))
				return // No wait needed
			}
		}
	}

	// Slow path: all slots are in use, must wait
	l.mu.Lock()
	idx := l.index.Load()
	lastNano := atomic.LoadInt64(&l.entries[idx])
	nextNano := lastNano + tickNano
	nowNano = time.Now().UnixNano()

	reservedAt := nowNano
	if nowNano < nextNano {
		reservedAt = nextNano
	}

	atomic.StoreInt64(&l.entries[idx], reservedAt)
	newIdx := (idx + 1) % uint32(l.count)
	l.index.Store(newIdx)

	// Cleanup stale entries periodically (prevent drift)
	currentTime := time.Now().UnixNano()
	if currentTime-l.lastCleanup > tickNano*2 {
		cutoff := currentTime - (tickNano * 10)
		for i := range l.entries {
			if atomic.LoadInt64(&l.entries[i]) < cutoff {
				atomic.StoreInt64(&l.entries[i], cutoff)
			}
		}
		l.lastCleanup = currentTime
	}

	l.mu.Unlock()

	if nowNano < nextNano {
		time.Sleep(time.Duration(nextNano - nowNano))
	}
}
