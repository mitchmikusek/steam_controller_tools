interface Props {
  onClick: () => void;
}

export function BackLink({ onClick }: Props) {
  return (
    <div className="back-link" onClick={onClick}>
      ← Back
    </div>
  );
}
