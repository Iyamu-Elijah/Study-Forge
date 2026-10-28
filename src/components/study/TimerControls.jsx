import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TimerControls({ status, phase, onStart, onPause, onReset, onSkip }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {status === 'running' ? (
        <Button size="lg" onClick={onPause}>
          <Pause className="mr-2 h-4 w-4" aria-hidden="true" />
          Pause
        </Button>
      ) : (
        <Button size="lg" onClick={onStart}>
          <Play className="mr-2 h-4 w-4" aria-hidden="true" />
          {status === 'paused' ? 'Resume' : 'Start'}
        </Button>
      )}

      <Button variant="outline" onClick={onReset} disabled={status === 'idle'}>
        <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Reset
      </Button>

      <Button variant="ghost" onClick={onSkip}>
        <SkipForward className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {phase === 'focus' ? 'Skip to break' : 'Back to focus'}
      </Button>
    </div>
  );
}