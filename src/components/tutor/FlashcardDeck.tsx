/**
 * FlashcardDeck — concept flashcards with front/back flip interaction.
 * Post-spec extension: not in the original component inventory (06).
 * Added to support active recall practice via the /flashcards slash command.
 * Progressive disclosure: thumbnail header → expanded card-by-card view.
 * AI-generated block — produced by /flashcards slash command.
 * Related: 03-interaction-language.md (Socratic method, interaction modes),
 *          01-design-principles.md (mastery through engagement)
 */
import { useState, useCallback } from 'react';
import type { Flashcard } from '@/types/entries';
import styles from './FlashcardDeck.module.css';

interface FlashcardDeckProps {
  title: string;
  cards: Flashcard[];
}

export function FlashcardDeck({ title, cards }: FlashcardDeckProps) {
  const [expanded, setExpanded] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const total = cards.length;

  const flip = useCallback(() => setFlipped((f) => !f), []);
  const next = useCallback(() => {
    setFlipped(false);
    setIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);
  const prev = useCallback(() => {
    setFlipped(false);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  if (!expanded) {
    return (
      <div className={styles.container}>
        <button className={styles.header} onClick={() => setExpanded(true)}
          aria-label={`Expand flashcards: ${title}`}>
          <span className={styles.icon}>◈</span>
          <div className={styles.titleArea}>
            <span className={styles.title}>{title}</span>
            <span className={styles.badge}>{total} cards</span>
          </div>
          <span className={styles.hint}>click to study</span>
        </button>
      </div>
    );
  }

  const card = cards[index];
  if (!card) return null;

  return (
    <div className={styles.container}>
      <div className={styles.headerExpanded}>
        <span className={styles.title}>{title}</span>
        <button className={styles.collapse} onClick={() => setExpanded(false)}
          aria-label="Collapse">↙</button>
      </div>
      <div className={styles.cardArea}>
        <button className={styles.card} onClick={flip}
          aria-label={flipped ? 'Show front' : 'Show back'}>
          <div className={`${styles.cardInner} ${flipped ? styles.flipped : ''}`}>
            <div className={styles.front}>
              <span className={styles.sideLabel}>question</span>
              <p className={styles.cardText}>{card.front}</p>
            </div>
            <div className={styles.back}>
              {card.imageUrl && (
                <img
                  className={styles.mnemonic}
                  src={card.imageUrl}
                  alt={`Visual mnemonic for ${card.concept ?? card.front}`}
                  loading="lazy"
                />
              )}
              <span className={styles.sideLabel}>answer</span>
              <p className={styles.cardText}>{card.back}</p>
            </div>
          </div>
        </button>
        <span className={styles.flipHint}>{flipped ? 'click to flip back' : 'click to reveal'}</span>
      </div>
      <div className={styles.nav}>
        <button className={styles.navBtn} onClick={prev}
          disabled={index === 0} aria-label="Previous">←</button>
        <span className={styles.progress}>{index + 1} / {total}</span>
        <button className={styles.navBtn} onClick={next}
          disabled={index === total - 1} aria-label="Next">→</button>
      </div>
    </div>
  );
}
