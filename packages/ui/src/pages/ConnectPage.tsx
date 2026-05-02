import { useState } from 'react';

interface Props {
  onConnect: () => Promise<void>;
}

export function ConnectPage({ onConnect }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    await onConnect();
    setLoading(false);
  };

  return (
    <div className="page page-centered page-wide">
      <div className="connect-prompt">
        <img src="controller-blueprint.png" alt="Steam Controller" />
        <div className="connect-hint">Plug in controller via USB, then click Connect</div>
        <button className="btn-blue" onClick={handleConnect} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    </div>
  );
}
export default ConnectPage;
