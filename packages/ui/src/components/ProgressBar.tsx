interface Props {
  percent: number;
  state: 'active' | 'complete' | 'error' | 'waiting';
}

export function ProgressBar({ percent, state }: Props) {
  const fillClass = `progress-fill${state !== 'active' ? ` ${state}` : ''}`;

  return (
    <>
      <div className="progress-track">
        <div className={fillClass} style={{ width: `${percent}%` }} />
      </div>
    </>
  );
}
