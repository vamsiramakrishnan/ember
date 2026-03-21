/**
 * Navigation — Three text labels: Notebook, Constellation, Philosophy.
 * Cormorant Garamond 14px, separated by 24px, on a thin ruled line.
 * See: 04-information-architecture.md, Navigation.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { motion } from '@/tokens/motion';

export type Surface = 'notebook' | 'constellation' | 'philosophy';

interface NavigationProps {
  active: Surface;
  onNavigate: (surface: Surface) => void;
}

const tabs: { id: Surface; label: string }[] = [
  { id: 'notebook', label: 'Notebook' },
  { id: 'constellation', label: 'Constellation' },
  { id: 'philosophy', label: 'Philosophy' },
];

export function Navigation({ active, onNavigate }: NavigationProps) {
  return (
    <nav
      style={{
        display: 'flex',
        gap: 24,
        borderBottom: `1px solid ${colors.ruleLight}`,
        paddingBottom: 12,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            style={{
              fontFamily: fontFamily.tutor,
              fontSize: '14px',
              fontWeight: 400,
              color: isActive ? colors.ink : colors.inkFaint,
              background: 'none',
              border: 'none',
              borderBottom: isActive
                ? `1.5px solid ${colors.ink}`
                : '1.5px solid transparent',
              paddingBottom: 10,
              cursor: 'pointer',
              transition: `color ${motion.tabTransition}, border-color ${motion.tabTransition}`,
              marginBottom: -13,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
