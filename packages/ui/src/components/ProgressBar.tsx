interface Props {
  percent: number;
  state: 'active' | 'complete' | 'error' | 'waiting';
}

export function ProgressBar({ percent, state }: Props) {
  const fillClass = `progress-fill${state !== 'active' ? ` ${state}` : ''}`;

  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Flash progress"
    >
      <div className={fillClass} style={{ width: `${percent}%` }} />
    </div>
  );
}
