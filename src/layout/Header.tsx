/**
 * Header — Logo, navigation tabs, student identity.
 * Quiet, functional, never competing with the content.
 */
import { Column } from '@/primitives/Column';
import { Navigation, type Surface } from './Navigation';
import { StudentIdentity } from '@/components/peripheral/StudentIdentity';
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';

interface HeaderProps {
  activeSurface: Surface;
  onNavigate: (surface: Surface) => void;
}

export function Header({ activeSurface, onNavigate }: HeaderProps) {
  return (
    <header style={{ paddingTop: 24 }}>
      <Column>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 20,
          }}
        >
          <h1
            style={{
              fontFamily: fontFamily.tutor,
              fontSize: '20px',
              fontWeight: 300,
              color: colors.ink,
              letterSpacing: '-0.3px',
              margin: 0,
            }}
          >
            Ember
          </h1>
          <StudentIdentity
            name="Arjun"
            duration="4 months"
            sessionNumber={47}
          />
        </div>
        <Navigation active={activeSurface} onNavigate={onNavigate} />
      </Column>
    </header>
  );
}
