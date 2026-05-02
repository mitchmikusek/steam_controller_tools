interface Props {
  title: string;
  desc: string;
  selected: boolean;
  installed?: boolean;
  onClick: () => void;
}

export function SelectCard({ title, desc, selected, installed, onClick }: Props) {
  return (
    <button
      type="button"
      className={`select-card${selected ? ' selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
      style={{ textAlign: 'left', width: '100%' }}
    >
      <div className="select-card-title">
        {title}
        {installed && <span className="badge badge-prod" style={{ marginLeft: 8 }}>INSTALLED</span>}
      </div>
      <div className="select-card-desc">{desc}</div>
    </button>
  );
}
