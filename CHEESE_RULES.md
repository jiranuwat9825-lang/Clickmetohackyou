# Steal Cheese (Cheese Thief)

Implemented from the publisher-authored English rulebook:
https://ludopedia-anexos.nyc3.digitaloceanspaces.com/cheese_thief_rules_217050.pdf
Publisher: https://www.jollythinkers.com/en/products/cheese-thief

The mode supports 4–8 players, one thief, sleepyheads and the optional Fall Mouse
for 6–8 players. The night runs through hours 1–6. The thief automatically takes
the cheese on their first waking hour. A lone sleepyhead may inspect one die;
other waking players see who is awake, whether cheese remains, and any theft.

Four players receive two dice each: sleepyheads choose one waking time, while
the thief wakes at both distinct times. This variant has no followers or die peeks.
In five-player games the thief selects one witnessing sleepyhead as a follower,
if any witness exists. For six, seven and eight players the thief selects one,
two and two followers, respectively, after the night. At seven players followers
know one another but are not told who the thief is. Six/eight-player teams know
the thief; a witnessed theft remains known independently of team introductions.

All players vote once for another player. Every tied highest-vote player is
revealed. If those include the thief, the remaining sleepyhead team wins;
otherwise the thief and followers win. A highest-vote Fall Mouse wins alone,
including ties and when recruited. Winners receive one hub point each.

Online adaptations: ten-second night hours, fifteen seconds for post-night
recruitment and ten seconds for team introductions, configurable discussion,
and a two-minute secret vote. The host may begin voting early or abort without
points. Unsubmitted votes are ignored at the deadline; zero votes award no points.
If a required follower selection times out, the system uses the first eligible
players from the shuffled seating order. UI states these adaptations.

Test bots receive their own role, dice, observations and permitted team knowledge.
They can prepare, inspect dice, recruit and vote; discussion remains human-led.
This mode uses the hub's existing shared-room/client-authoritative privacy model,
not a protected server-based hidden-information implementation.

Run all automated checks with:
`node --test tests/cryptid.test.js tests/hub-regressions.test.js tests/cheese.test.js`
