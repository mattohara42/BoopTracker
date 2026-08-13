# Boop App - Backlog

Everything from the brainstorm that isn't in SPEC.md v1. Not forgotten, just not
first. Pull items into a future milestone as they come up.

## Open Questions (need a decision before building)

- Boop type unlock order/prerequisites beyond the 3 in v1: what unlocks next, and
  what does it require? (First pass idea from brainstorming: 5 boops unlocks
  hand/finger variations, 10 boops unlocks location variations, specific
  achievements unlock pose/style variations, mastering basics unlocks combos. Not
  finalized.)
- Can Free Boops or Shields be gifted to another player?
- Hidden achievements: any hints given, or fully mysterious?
- Do achievements ever expire or can they be lost, or are they permanent once
  unlocked?
- How do we know someone's region for region leaderboards? Automatic from phone
  location, or manual selection?

## Adding people (from the M1 playtest, 2026-08-13)

Playtest verdict: three taps feels fast, type-picking is fun, locked slots +
finish moment land. The one friction: adding a **brand-new** person mid-boop is
too slow — typing a name is the worst thing to do while "fleeing the scene."
The fix is to make sure you rarely type mid-boop: have your people already
loaded, so the mid-boop step is almost always a tap on a recent/known face.

Ideas that came out of it:

- **Import contacts from the phone** — the fast way to populate your people up
  front (device Contacts → pick who to add). Strong candidate for the M2
  friend-adding UX; needs a privacy decision (whose contacts, kid-appropriate
  consent) before building. Client capability is `expo-contacts` (works in Expo
  Go), so it *could* be prototyped on the M1 fake-data build ahead of full M2.
- **Add people up front by speaking their names** (voice input) — a fun,
  kid-friendly way to add several people quickly at setup. Deferred/stretch;
  revisit after contacts import (which likely covers most of the need).

Keep the mid-boop "Someone else…" typed entry as a fallback, just not the
primary path.

## Additional Boop Types (beyond v1's Classic/Boopstache/Bellyboop/Underboop)

Hand/Finger: Double-Finger Boop, Knuckle Boop, Palm Boop, Pinky Boop, Boop Slap,
The Flick, Reverse Boop

Body Location: Ear Boop, Chin Boop, Forehead Boop, Shoulder Boop, Elbow Boop, Shin
Boop, Knee Boop

Multi-Person: Double Boop Gum (boop two at once), Triple Threat Boop, Group Boop,
Tag Team Boop, Boop Relay

Pose/Style: Superboop (superhero pose), Ninja Boop, Matrix Boop, Slow Motion Boop,
Lightning Boop, Theatrical Boop, The Spin, Breakdance Boop

Location/Angle: Overboop, Boop from Behind, Corner Boop / Sneak Attack, Mirror
Boop, Window Boop, Across the Room Boop, Ceiling Boop
(note: Sneak Attack, Corner Boop, and Boop from Behind overlap heavily, cull to one
when this gets built)

Timing: Sneeze Boop, Yawn Boop, Sleepy Boop, Wake Up Boop, Photo Boop, Video Call
Boop, Zoom Boop, Whisper Boop

Combo (unlockable, need multiple types first): The Combo (3 types on same person in
one day), Boop Cascade, The Setup, Synchronized Boop

## Achievements Not in Week One

### Basic Milestones
Boop Master (50 total), Boop Legend (100 total)

### Speed Challenges
Lunch Break Boop, Speed Booper (within 5 min of waking up)

### Sneakiness & Strategy
Revenge Boop, Sneaky Double

### Seasonal
Winter/Spring/Summer/Fall Boop

### Holidays
New Year, Valentine's, St. Patrick's, April Fools, Mother's Day, Father's Day,
Halloween, Thanksgiving, Christmas, Birthday Surprise, Boop Blast (get booped on
your own birthday)

### Location-Based
Backyard Champion, more locations TBD

### Being Booped
Counter Attack (boop back right after getting booped), Boop Magnet (booped by 5
different people)

### Family
Grandparent Surprise, Aunt/Uncle Attack, Family Gathering (3 family members in one
day)

### Social
Boop War (exchange with a friend)

### Boopability
Boop Magnet (most booped, leaderboard-tied), Elusive (least booped, leaderboard-tied)

### Hidden / Unlockable
Not designed yet. Needs its own design pass, see Open Questions.

### Creative & Funny (full list, ~90 ideas)
Movie/Show references: Home Alone, Mission Impossible, Ocean's Eleven, James Bond,
The Matrix, Avengers Assemble, The Godfather, Inception, The Sting, Die Hard, Jaws,
Jurassic Park, The Sixth Sense, Scream, The Ring, Forrest Gump, Frozen, Toy Story,
Shrek, Wizard of Oz, Ghostbusters, Back to the Future, Finding Nemo, The Dark
Knight, Elf, Wreck-It Ralph, Spider-Man, Deadpool

Cartoon/Anime: Dragon Ball Z, Looney Tunes, Attack on Titan, My Hero Academia,
Scooby-Doo, Spongebob, Avatar: The Last Airbender

Sports/Gaming: The Slam Dunk, Perfect Game, Speedrun Boop, No-Look Boop, The Hat
Trick, Boop Like Beckham, Fortnite Boop, League of Legends Boop (Pentakill)

Physical/Body Humor: The Sneeze Disaster, Boop While Falling, The Singing Boop,
Mid-Bite Boop, The Phone Boop, The Yawning Boop, Boop During a Laugh

Sibling Chaos: Sibling Revenge Cascade, The Blame Boop, Double Team Defense,
Sibling Boop War, The Drop

Escalation: Boop Addiction, Boop Mercy, The Persistent Booper, Boop Immunity

Weird Locations/Times: The Pajama Boop, School Boop, Restaurant Boop, Boop at the
Grocery Store, The Sunglasses Boop, Boop on Vacation, The Costume Boop, Video Call
Boop

Silly/Absurd: The Accidental Boop, The Delayed Reaction, The Most Boops in a Day,
Boop at Exactly Midnight, The Synchronized Sneeze Boop
(note: cut "Boop a Stranger" and "Boop someone in trouble/teacher-parent-when-
angry", flagged as bad ideas during design, don't reintroduce without discussing
why)

Getting Booped Back: The Trap, Boop Victim (booped by 10 different people), The
Target (most booped in friend group)

Family Chaos: The Family Gathering Boop-Off, Younger Sibling Revenge

Absolutely Bonkers: The Boop Montage, Boop Chronicles, Boop Royale, The Boop
Prophecy, Boop in 4K, The Boop Heard 'Round the World, Boop Fever, The Great Boop
War of [Year], Boop Mythology, The Boop Awakening

Really Silly: The Accidental Legend, Boop Denial, The Boop Witness, Boop Spectator,
The Double-Take Boop, Boop Paralysis, The Boop Soundtrack, The Confused Boop, Boop
Zen, The Philosophical Boop

## Leaderboards Not in v1

- Global leaderboard (all three stats)
- Country/region leaderboards (all three stats)
- Time-windowed views: This Week, This Month (v1 is all-time only)

## Known Duplicates / Overlaps to Clean Up When Building These

- "Boop Magnet" used for two different meanings (get booped by 5 people vs. most
  booped on leaderboard). Pick one meaning, rename the other.
- "Video Call Boop" appears twice in the original brainstorm list
- "Matrix Boop" appears twice
- Sneak Attack / Corner Boop / Boop from Behind are basically the same idea, merge
  into one
