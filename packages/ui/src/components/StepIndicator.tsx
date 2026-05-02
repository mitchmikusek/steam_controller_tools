interface Props {
  current: number;
  total?: number;
  error?: boolean;
}

const stepLabels = ['Choose Firmware', 'Pre-flight Checks', 'Flashing', 'Complete'];

export function StepIndicator({ current, total = 4, error = false }: Props) {
  const label = error
    ? `Step ${total} of ${total}: Error`
    : `Step ${current + 1} of ${total}: ${stepLabels[current] ?? ''}`;

  return (
    <div
      className="steps"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={label}
    >
      {Array.from({ length: total }, (_, i) => {
        let cls = 'step-dot';
        if (error && i === total - 1) cls += ' error';
        else if (i < current) cls += ' done';
        else if (i === current) cls += ' active';
        return <div key={i} className={cls} />;
      })}
    </div>
  );
}
