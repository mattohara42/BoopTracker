import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { LEADERBOARD_STATS, type LeaderboardStat } from '@/config/constants';
import { db } from '@/firebase/app';
import {
  groupMemberUids,
  rankMembers,
  type LeaderboardGroup,
  type MemberStats,
} from '@/features/leaderboard/leaderboardCore';
import { useBoopLog } from '@/state/BoopLog';
import { usePendingBoops } from '@/state/PendingBoops';
import { usePeople } from '@/state/People';
import { colors, radius, shadow, space } from '@/theme/colors';

/**
 * LeaderboardScreen — the M6 leaderboards. All-time only (SPEC: week/month views
 * are BACKLOG). Two groups (Family / Friends) over the four `LEADERBOARD_STATS`.
 *
 * Data path (no Cloud Function, still Spark): my own row comes from my live
 * `BoopLog` + `PendingBoops` numbers; each app-friend's row is read from their
 * small public stats doc (`users/{uid}/public/stats`, written by `StatsPublisher`).
 * Ranking lives in the pure, tested `leaderboardCore`.
 */

const GROUPS: { id: LeaderboardGroup; label: string }[] = [
  { id: 'family', label: 'Family' },
  { id: 'friends', label: 'Friends' },
];

const STAT_META: Record<LeaderboardStat, { label: string; emoji: string; unit: string }> = {
  most_total_boops: { label: 'Most boops', emoji: '👆', unit: 'given' },
  most_unique_people: { label: 'Most people booped', emoji: '🎯', unit: 'people' },
  most_boops_received: { label: 'Most booped', emoji: '😝', unit: 'received' },
  least_boops_received: { label: 'Least booped', emoji: '🛡️', unit: 'received' },
};

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardScreen() {
  const { user, profile } = useAuth();
  const { people } = usePeople();
  const { totalBoops, uniquePeopleBooped } = useBoopLog();
  const { timesBooped } = usePendingBoops();

  const [group, setGroup] = useState<LeaderboardGroup>('family');
  const [stat, setStat] = useState<LeaderboardStat>('most_total_boops');

  const myUid = user?.uid ?? 'me';

  // The app-friends in this group, and a uid → display-name map from my people
  // list (I own their names locally, so no extra profile read needed).
  const memberUids = useMemo(() => groupMemberUids(people, group), [people, group]);
  const memberKey = memberUids.join(',');
  const nameByUid = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of people) if (p.friendUid) map[p.friendUid] = p.name;
    return map;
  }, [people]);

  // One live listener per member's public stats doc; re-subscribed only when the
  // set of members changes (keyed on memberKey), not on every people snapshot.
  const [statsByUid, setStatsByUid] = useState<Record<string, MemberStats>>({});
  useEffect(() => {
    const uids = memberKey ? memberKey.split(',') : [];
    if (uids.length === 0) {
      setStatsByUid({});
      return;
    }
    const unsubs = uids.map((fuid) =>
      onSnapshot(
        doc(db, 'users', fuid, 'public', 'stats'),
        (snap) => {
          const d = snap.data() ?? {};
          setStatsByUid((prev) => ({
            ...prev,
            [fuid]: {
              uid: fuid,
              username: (d.username as string) ?? '',
              totalBoops: (d.totalBoops as number) ?? 0,
              uniquePeopleBooped: (d.uniquePeopleBooped as number) ?? 0,
              boopsReceived: (d.boopsReceived as number) ?? 0,
            },
          }));
        },
        () => {},
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, [memberKey]);

  const ranked = useMemo(() => {
    const rows: MemberStats[] = [
      {
        uid: myUid,
        username: profile?.username ?? 'You',
        totalBoops,
        uniquePeopleBooped,
        boopsReceived: timesBooped,
      },
      ...memberUids.map((fuid) => {
        const s = statsByUid[fuid];
        return {
          uid: fuid,
          username: nameByUid[fuid] || s?.username || 'Friend',
          totalBoops: s?.totalBoops ?? 0,
          uniquePeopleBooped: s?.uniquePeopleBooped ?? 0,
          boopsReceived: s?.boopsReceived ?? 0,
        };
      }),
    ];
    return rankMembers(rows, stat);
  }, [
    myUid,
    profile,
    totalBoops,
    uniquePeopleBooped,
    timesBooped,
    memberUids,
    statsByUid,
    nameByUid,
    stat,
  ]);

  const meta = STAT_META[stat];
  const soloGroup = memberUids.length === 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Group: Family / Friends */}
      <View style={styles.segment}>
        {GROUPS.map((g) => {
          const active = g.id === group;
          return (
            <TouchableOpacity
              key={g.id}
              style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              onPress={() => setGroup(g.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Stat selector */}
      <View style={styles.statPills}>
        {LEADERBOARD_STATS.map((s) => {
          const active = s === stat;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.statPill, active && styles.statPillActive]}
              onPress={() => setStat(s)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={styles.statPillEmoji}>{STAT_META[s].emoji}</Text>
              <Text style={[styles.statPillText, active && styles.statPillTextActive]}>
                {STAT_META[s].label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.caption}>
        {meta.emoji} {meta.label} · all-time
      </Text>

      <View style={styles.board}>
        {ranked.map((row) => {
          const isMe = row.uid === myUid;
          const medal = row.rank <= MEDALS.length ? MEDALS[row.rank - 1] : null;
          return (
            <View
              key={row.uid}
              style={[styles.row, isMe && styles.rowMe]}
              accessibilityLabel={`Rank ${row.rank}, ${row.username}${
                isMe ? ' (you)' : ''
              }, ${row.value} ${meta.unit}`}
            >
              <Text style={styles.rank}>{medal ?? `#${row.rank}`}</Text>
              <Text style={[styles.name, isMe && styles.nameMe]} numberOfLines={1}>
                {row.username}
                {isMe ? ' (you)' : ''}
              </Text>
              <Text style={styles.value}>{row.value}</Text>
            </View>
          );
        })}
      </View>

      {soloGroup && (
        <Text style={styles.empty}>
          {group === 'family'
            ? 'Tag a friend as family (Friends tab → pick a relation) to see them here — they need a BoopTracker account.'
            : 'Add friends by username on the Friends tab to fill out the leaderboard.'}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, paddingBottom: space.xl },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segmentBtnActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: 15, fontWeight: '800', color: colors.muted },
  segmentTextActive: { color: colors.primaryText },
  statPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.lg,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statPillActive: { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
  statPillEmoji: { fontSize: 14 },
  statPillText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  statPillTextActive: { color: colors.text },
  caption: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.muted,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  board: { gap: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    ...shadow.card,
  },
  rowMe: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  rank: { fontSize: 20, fontWeight: '900', width: 44, color: colors.text },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  nameMe: { color: colors.primary, fontWeight: '900' },
  value: { fontSize: 22, fontWeight: '900', color: colors.accent, marginLeft: space.sm },
  empty: {
    fontSize: 13,
    color: colors.muted,
    marginTop: space.lg,
    lineHeight: 19,
    textAlign: 'center',
  },
});
