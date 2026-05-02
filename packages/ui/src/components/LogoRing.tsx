interface Props {
  state: 'spinning' | 'complete' | 'error';
}

export function LogoRing({ state }: Props) {
  const ringClass = `logo-ring${state === 'complete' ? ' complete' : state === 'error' ? ' error' : ''}`;

  return (
    <div className={ringClass}>
      <div className="arc-bg" />
      <div className="arc-wrap">
        <div className="arc" />
      </div>
      {state === 'spinning' ? (
        <img className="icon" src="steam-logo.webp" alt="Steam" style={{ width: 140, height: 140 }} />
      ) : (
        <div className="icon" style={{ fontSize: '4rem' }}>
          {state === 'complete' ? '\u2713' : '\u2717'}
        </div>
      )}
    </div>
  );
}
