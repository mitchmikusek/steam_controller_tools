interface Props {
  current: number;
  total?: number;
  error?: boolean;
}

export function StepIndicator({ current, total = 4, error = false }: Props) {
  return (
    <div className="steps">
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
