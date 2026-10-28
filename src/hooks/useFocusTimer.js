import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Pomodoro state machine.
 *
 * Timing is anchored to wall-clock timestamps (not to tick counts), so pausing,
 * refreshing or backgrounding the tab cannot drift the countdown. A run is only ever
 * recorded after the student confirms it — a refresh mid-session never silently
 * claims a completed session.
 */
const STORAGE_KEY = 'studyforge.timer';

const readSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeSaved = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* private mode */
  }
};

const clearSaved = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

export default function useFocusTimer({
  focusMinutes = 25,
  shortBreakMinutes = 5,
  longBreakMinutes = 15,
  longBreakEvery = 4,
  onFinish,
}) {
  const secondsFor = useCallback(
    (target) => {
      const minutes =
        target === 'focus' ? focusMinutes : target === 'short_break' ? shortBreakMinutes : longBreakMinutes;
      return Math.max(60, Math.round((minutes || 1) * 60));
    },
    [focusMinutes, shortBreakMinutes, longBreakMinutes],
  );

  const [phase, setPhase] = useState('focus');
  const [status, setStatus] = useState('idle');
  const [remaining, setRemaining] = useState(() => Math.max(60, Math.round(focusMinutes * 60)));
  const [cycle, setCycle] = useState(0);

  const runStartRef = useRef(null);
  const endsRef = useRef(null);
  const elapsedBeforeRef = useRef(0);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const saved = readSaved();
    if (!saved?.phase) return;

    setPhase(saved.phase);
    if (typeof saved.cycle === 'number') setCycle(saved.cycle);

    if (saved.status === 'running' && saved.endsAt) {
      const now = Date.now();
      if (saved.endsAt > now) {
        runStartRef.current = saved.startedAt ? new Date(saved.startedAt).getTime() : now;
        elapsedBeforeRef.current = saved.elapsedBefore ?? 0;
        endsRef.current = saved.endsAt;
        setRemaining(Math.max(0, Math.round((saved.endsAt - now) / 1000)));
        setStatus('running');
        return;
      }
      clearSaved();
      setRemaining(0);
      setStatus('completed');
      onFinishRef.current?.({
        phase: saved.phase,
        elapsedMinutes: saved.minutes ?? Math.round(secondsFor(saved.phase) / 60),
        startedAt: saved.startedAt ?? new Date().toISOString(),
        restored: true,
      });
      return;
    }

    if (saved.status === 'paused') {
      elapsedBeforeRef.current = saved.elapsedBefore ?? 0;
      setRemaining(saved.remaining ?? secondsFor(saved.phase));
      setStatus('paused');
      return;
    }

    setRemaining(secondsFor(saved.phase));
    setStatus('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === 'idle') setRemaining(secondsFor(phase));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMinutes, shortBreakMinutes, longBreakMinutes, phase]);

  useEffect(() => {
    if (status !== 'running') return undefined;

    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.round((endsRef.current - now) / 1000));
      setRemaining(left);

      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        elapsedBeforeRef.current += (now - (runStartRef.current ?? now)) / 1000;
        runStartRef.current = null;
        endsRef.current = null;
        setStatus('completed');
        clearSaved();
        onFinishRef.current?.({
          phase,
          elapsedMinutes: Math.max(1, Math.round(elapsedBeforeRef.current / 60)),
          plannedMinutes: Math.round(secondsFor(phase) / 60),
          startedAt: new Date(now).toISOString(),
        });
      }
    };

    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [status, phase, secondsFor]);

  const start = useCallback(() => {
    if (status === 'running') return;
    const now = Date.now();
    const seconds = remaining > 0 ? remaining : secondsFor(phase);
    if (remaining <= 0) {
      elapsedBeforeRef.current = 0;
      setRemaining(seconds);
    }
    runStartRef.current = now;
    endsRef.current = now + seconds * 1000;
    finishedRef.current = false;
    setStatus('running');
    writeSaved({
      phase,
      status: 'running',
      endsAt: endsRef.current,
      startedAt: new Date(now).toISOString(),
      elapsedBefore: elapsedBeforeRef.current,
      cycle,
      minutes: Math.max(1, Math.round((elapsedBeforeRef.current + seconds) / 60)),
    });
  }, [status, remaining, phase, cycle, secondsFor]);

  const pause = useCallback(() => {
    if (status !== 'running') return;
    elapsedBeforeRef.current += (Date.now() - (runStartRef.current ?? Date.now())) / 1000;
    runStartRef.current = null;
    endsRef.current = null;
    setStatus('paused');
    writeSaved({
      phase,
      status: 'paused',
      remaining,
      elapsedBefore: elapsedBeforeRef.current,
      cycle,
    });
  }, [status, remaining, phase, cycle]);

  const reset = useCallback(() => {
    elapsedBeforeRef.current = 0;
    runStartRef.current = null;
    endsRef.current = null;
    finishedRef.current = false;
    setStatus('idle');
    setRemaining(secondsFor(phase));
    clearSaved();
  }, [phase, secondsFor]);

  const switchPhase = useCallback(
    (next) => {
      elapsedBeforeRef.current = 0;
      runStartRef.current = null;
      endsRef.current = null;
      finishedRef.current = false;
      setPhase(next);
      setStatus('idle');
      setRemaining(secondsFor(next));
      clearSaved();
    },
    [secondsFor],
  );

  /** Moves to the next phase after a run is confirmed or discarded. */
  const advance = useCallback(() => {
    elapsedBeforeRef.current = 0;
    runStartRef.current = null;
    endsRef.current = null;
    finishedRef.current = false;
    const nextCycle = phase === 'focus' ? cycle + 1 : cycle;
    const every = Math.max(1, longBreakEvery || 4);
    const next =
      phase === 'focus' ? (nextCycle % every === 0 ? 'long_break' : 'short_break') : 'focus';
    setCycle(nextCycle);
    setPhase(next);
    setStatus('idle');
    setRemaining(secondsFor(next));
    clearSaved();
    return next;
  }, [phase, cycle, longBreakEvery, secondsFor]);

  const totalSeconds = secondsFor(phase);
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remaining / totalSeconds)) : 0;

  return { phase, status, remaining, totalSeconds, progress, cycle, start, pause, reset, switchPhase, advance };
}