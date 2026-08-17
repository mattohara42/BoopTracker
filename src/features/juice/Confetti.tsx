import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { makeConfettiPieces, type ConfettiPiece } from './confettiCore';

/**
 * Confetti — the real M7.5 burst that replaces the static 🎉 placeholder. A
 * full-bleed, non-interactive overlay of little colored squares that fall, drift
 * and spin, then fade. Built on React Native's `Animated` (no extra dependency,
 * so it's safe in Expo Go) and driven natively (transform + opacity only).
 *
 * Layout math lives in the pure, tested `confettiCore`; this component only
 * animates it. Mount it where you want the celebration (behind a card, over the
 * finish screen); it plays once on mount. `pointerEvents="none"` so it never
 * eats taps on whatever it covers.
 */
export function Confetti({ count = 26 }: { count?: number }) {
  const { width, height } = useWindowDimensions();

  // Generate the pieces once per mount so the burst is stable across re-renders.
  const pieces = useMemo(() => makeConfettiPieces(count, Math.random), [count]);
  // One driver per piece (0 → 1 over its own fall).
  const progress = useRef<Animated.Value[]>(pieces.map(() => new Animated.Value(0)));

  useEffect(() => {
    const anims = pieces.map((p, i) =>
      Animated.timing(progress.current[i], {
        toValue: 1,
        duration: p.duration,
        delay: p.delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    Animated.parallel(anims).start();
  }, [pieces]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <Piece key={p.key} piece={p} progress={progress.current[i]} width={width} height={height} />
      ))}
    </View>
  );
}

function Piece({
  piece,
  progress,
  width,
  height,
}: {
  piece: ConfettiPiece;
  progress: Animated.Value;
  width: number;
  height: number;
}) {
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, height + 40],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, piece.xDrift],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${piece.rotations * 360}deg`],
  });
  // Hidden until it starts, full through the fall, then fades as it lands.
  const opacity = progress.interpolate({
    inputRange: [0, 0.06, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: piece.xStart * Math.max(0, width - piece.size),
        width: piece.size,
        height: piece.size,
        borderRadius: 2,
        backgroundColor: piece.color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}
