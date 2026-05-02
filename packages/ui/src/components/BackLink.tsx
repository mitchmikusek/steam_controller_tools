interface Props {
  onClick: () => void;
}

export function BackLink({ onClick }: Props) {
  return (
    <button className="back-link" onClick={onClick} type="button">
      ← Back
    </button>
  );
}
