import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onConnect: () => Promise<void>;
}

export function ConnectPage({ onConnect }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    await onConnect();
    setLoading(false);
  };

  return (
    <div className="page page-centered page-wide">
      <div className="connect-prompt">
        <img src="controller-blueprint.webp" alt="Steam Controller" />
        <div className="connect-hint">{t('connect.hint')}</div>
        <button className="btn-blue" onClick={handleConnect} disabled={loading}>
          {loading ? t('connect.connecting') : t('connect.button')}
        </button>
      </div>
    </div>
  );
}
export default ConnectPage;
