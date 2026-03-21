/**
 * Footer — The quiet footer.
 * Nearly invisible. Present but not demanding.
 */
import { Column } from '@/primitives/Column';
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';

export function Footer() {
  return (
    <footer style={{ paddingBottom: 40, paddingTop: 24 }}>
      <Column>
        <p
          style={{
            fontFamily: fontFamily.system,
            fontSize: '10px',
            fontWeight: 300,
            color: colors.inkGhost,
            letterSpacing: '1px',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Ember — aristocratic tutoring for every child
        </p>
      </Column>
    </footer>
  );
}
