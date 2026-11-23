import { AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { MotionRoot } from './motion';
import { MenuPanel } from './panels/MenuPanel';
import { WalletPanel } from './panels/WalletPanel';
import { CardScreen } from './screens/CardScreen';
import { ErrorScreen } from './screens/ErrorScreen';
import { Lottery } from './screens/Lottery';
import { OutcomeScreen } from './screens/OutcomeScreen';
import { RecapScreen } from './screens/RecapScreen';
import { ReportScreen } from './screens/ReportScreen';
import { Welcome } from './screens/Welcome';
import { useApp, useLocale } from './store';

function CurrentScreen() {
  const screen = useApp((st) => st.game?.screen.name ?? null);
  const isFailed = useApp((st) => st.failed);
  const quit = useApp((st) => st.quit);
  if (isFailed) return <ErrorScreen onReset={quit} />;
  switch (screen) {
    case null: return <Welcome />;
    case 'lottery': return <Lottery />;
    case 'card': return <CardScreen />;
    case 'outcome': return <OutcomeScreen />;
    case 'recap': return <RecapScreen />;
    case 'report': return <ReportScreen />;
  }
}

export function App() {
  const locale = useLocale();
  const panel = useApp((st) => st.panel);
  const hasGame = useApp((st) => st.game !== null);
  const quit = useApp((st) => st.quit);

  useEffect(() => {
    document.documentElement.lang = locale === 'jaksel' ? 'id' : 'en';
  }, [locale]);

  return (
    <MotionRoot>
      <main className="app" inert={panel !== null}>
        <ErrorBoundary onReset={quit} fallback={(reset) => <ErrorScreen onReset={reset} />}>
          <CurrentScreen />
        </ErrorBoundary>
      </main>
      <AnimatePresence>
        {panel === 'menu' && <MenuPanel key="menu" />}
        {panel === 'wallet' && hasGame && <WalletPanel key="wallet" />}
      </AnimatePresence>
    </MotionRoot>
  );
}
