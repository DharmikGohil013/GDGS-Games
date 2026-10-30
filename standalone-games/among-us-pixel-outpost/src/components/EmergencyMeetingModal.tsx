import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../game/audio.ts';
import { generateBotMeetingDialogue } from '../game/botAI.ts';
import { tallyVotes } from '../game/rules.ts';
import { MeetingMessage, Player, PLAYER_COLORS } from '../game/types.ts';

interface Props {
  players: Player[];
  meetingReason: 'emergency' | 'body';
  reporterId?: string;
  victimBodyOf?: string;
  meetingTimerMax?: number;
  onConcludeMeeting: (ejectedPlayerId: string | null, wasTie: boolean, isSkip: boolean) => void;
}

export const EmergencyMeetingModal: React.FC<Props> = ({
  players,
  meetingReason,
  reporterId,
  victimBodyOf,
  meetingTimerMax = 45,
  onConcludeMeeting,
}) => {
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [votes, setVotes] = useState<Record<string, string | 'skip'>>({});
  const [hasPlayerVoted, setHasPlayerVoted] = useState(false);
  const [votingPhase, setVotingPhase] = useState<'discussion' | 'voting' | 'revealed'>('discussion');
  const [timer, setTimer] = useState(meetingTimerMax);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const localPlayer = players.find((p) => !p.isBot)!;
  const reporter = players.find((p) => p.id === reporterId);
  const victim = players.find((p) => p.id === victimBodyOf);

  // Play opening audio sting
  useEffect(() => {
    if (meetingReason === 'body') {
      audio.playDeadBodyReported();
    } else {
      audio.playEmergencyHorn();
    }
  }, [meetingReason]);

  // Initial bot remarks and discussion flow
  useEffect(() => {
    const aliveBots = players.filter((p) => p.isBot && !p.isDead);

    // Initial message from reporter if bot
    if (reporter && reporter.isBot) {
      setTimeout(() => {
        const text = generateBotMeetingDialogue(reporter, meetingReason, reporter, victim, players);
        addMessage(reporter, text);
      }, 700);
    }

    // Additional bot responses spread over time
    aliveBots.slice(0, 4).forEach((bot, index) => {
      if (bot.id === reporterId) return;
      setTimeout(() => {
        const text = generateBotMeetingDialogue(bot, meetingReason, reporter, victim, players);
        addMessage(bot, text);
      }, 1800 + index * 1600);
    });

    // Switch to voting after 6 seconds or immediate
    const voteTimeout = setTimeout(() => {
      setVotingPhase('voting');
    }, 4500);

    return () => clearTimeout(voteTimeout);
  }, []);

  // Main countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          concludeVoting();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [votes]);

  // Scroll chat on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (sender: Player, text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_${Math.random()}`,
        senderId: sender.id,
        senderName: sender.name,
        senderColor: sender.color,
        text,
        timestamp: Date.now(),
        isDead: sender.isDead,
      },
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || localPlayer.isDead) return;

    audio.playTaskStep();
    addMessage(localPlayer, chatInput.trim());

    // Bots react to player chat if accusing or asking
    const lower = chatInput.toLowerCase();
    const aliveBots = players.filter((p) => p.isBot && !p.isDead);

    setTimeout(() => {
      const responder = aliveBots[Math.floor(Math.random() * aliveBots.length)];
      if (responder) {
        // Check if player mentioned a specific color or name
        const mentionedPlayer = players.find(
          (p) =>
            p.id !== localPlayer.id &&
            (lower.includes(p.name.toLowerCase()) || lower.includes(p.color.toLowerCase()))
        );

        if (mentionedPlayer) {
          if (
            lower.includes('sus') ||
            lower.includes('kill') ||
            lower.includes('vent') ||
            lower.includes('vote') ||
            lower.includes('impostor')
          ) {
            responder.suspicionMap[mentionedPlayer.id] =
              (responder.suspicionMap[mentionedPlayer.id] || 0) + 40;
            addMessage(
              responder,
              `I agree with ${localPlayer.name}, ${mentionedPlayer.name.toUpperCase()} has been acting super suspicious!`
            );
          } else {
            addMessage(responder, `Did anyone else see ${mentionedPlayer.name.toUpperCase()} nearby?`);
          }
        } else if (lower.includes('skip') || lower.includes('tie')) {
          addMessage(responder, 'Sounds good, skipping vote for safety.');
        } else if (lower.includes('where') || lower.includes('who')) {
          addMessage(
            responder,
            `I was in ${responder.lastActiveRoom || 'Navigation'} doing tasks.`
          );
        } else {
          addMessage(responder, `Let's discuss carefully before we cast our votes.`);
        }
      }
    }, 1100);

    setChatInput('');
  };

  const handleCastVote = (targetId: string | 'skip') => {
    if (hasPlayerVoted || localPlayer.isDead) return;

    audio.playVoteCast();
    const nextVotes = { ...votes, [localPlayer.id]: targetId };
    setVotes(nextVotes);
    setHasPlayerVoted(true);

    // Generate votes for all alive bots
    const aliveBots = players.filter((p) => p.isBot && !p.isDead);
    aliveBots.forEach((bot) => {
      // Pick target based on suspicion or vote skip
      const highestSuspect = Object.entries(bot.suspicionMap).sort((a, b) => b[1] - a[1])[0];
      if (highestSuspect && highestSuspect[1] >= 65 && Math.random() < 0.7) {
        nextVotes[bot.id] = highestSuspect[0];
      } else if (targetId !== 'skip' && Math.random() < 0.35) {
        // Bandwagon with player
        nextVotes[bot.id] = targetId;
      } else {
        nextVotes[bot.id] = 'skip';
      }
    });

    setVotes(nextVotes);

    // If all voted, conclude immediately
    setTimeout(() => {
      concludeVoting(nextVotes);
    }, 1500);
  };

  const concludeVoting = (finalVotes = votes) => {
    setVotingPhase('revealed');

    // Fill missing bot votes with 'skip' if timer ran out
    const alivePlayers = players.filter((p) => !p.isDead);
    const completedVotes = { ...finalVotes };
    for (const p of alivePlayers) {
      if (!completedVotes[p.id]) {
        completedVotes[p.id] = 'skip';
      }
    }

    setVotes(completedVotes);

    setTimeout(() => {
      const result = tallyVotes(completedVotes, alivePlayers);
      onConcludeMeeting(result.ejectedId, result.wasTie, result.isSkip);
    }, 3200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 select-none">
      <div className="relative flex h-full max-h-[640px] w-full max-w-4xl flex-col border-4 border-slate-700 bg-slate-950 text-white shadow-2xl">
        {/* Header Alert Banner */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 bg-slate-900 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            <h1 className="font-pixel text-xs text-red-400">
              {meetingReason === 'body'
                ? `DEAD BODY REPORTED! (FOUND BY ${reporter?.name.toUpperCase() || 'CREW'})`
                : 'EMERGENCY MEETING CALLED!'}
            </h1>
          </div>
          <div className="font-pixel text-xs text-amber-400">
            TIME: {timer}s
          </div>
        </div>

        {/* Meeting Content: Split into Players Table & Chat Panel */}
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {/* Players Table (Left) */}
          <div className="flex-1 overflow-y-auto p-4 border-b-2 md:border-b-0 md:border-r-2 border-slate-800">
            <div className="mb-2 font-pixel text-[9px] text-slate-400">
              CREW STATUS ({players.filter((p) => !p.isDead).length}/10 ALIVE)
            </div>

            <div className="grid grid-cols-2 gap-2">
              {players.map((p) => {
                const color = PLAYER_COLORS[p.color];
                const isVoterLocal = p.id === localPlayer.id;
                const targetVotedByLocal = votes[localPlayer.id] === p.id;
                const votersForThisPlayer = Object.entries(votes).filter(([, target]) => target === p.id);

                return (
                  <div
                    key={p.id}
                    className={`relative flex items-center justify-between border-2 p-2 ${
                      p.isDead
                        ? 'border-slate-800 bg-black/40 opacity-40'
                        : isVoterLocal
                        ? 'border-sky-500 bg-slate-900/80'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Character avatar badge */}
                      <div
                        style={{ backgroundColor: color.hex }}
                        className="h-7 w-7 rounded-md border border-slate-950 flex items-center justify-center font-pixel text-[8px] text-white shadow"
                      >
                        {p.isDead ? '💀' : p.color[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-pixel text-[9px]">{p.name}</div>
                        <div className="font-retro text-[8px] text-slate-400">
                          {p.isDead ? 'DEAD' : isVoterLocal ? 'YOU' : 'ALIVE'}
                        </div>
                      </div>
                    </div>

                    {/* Voting Action */}
                    {!p.isDead && !localPlayer.isDead && (
                      <div>
                        {votingPhase === 'voting' && !hasPlayerVoted ? (
                          <button
                            onClick={() => handleCastVote(p.id)}
                            className="cursor-pointer border border-emerald-500 bg-emerald-700/80 px-2 py-1 font-pixel text-[8px] hover:bg-emerald-600 active:scale-95"
                          >
                            VOTE
                          </button>
                        ) : targetVotedByLocal ? (
                          <span className="font-pixel text-[8px] text-emerald-400">VOTED</span>
                        ) : null}
                      </div>
                    )}

                    {/* Revealed Vote Tokens */}
                    {votingPhase === 'revealed' && votersForThisPlayer.length > 0 && (
                      <div className="absolute -bottom-2 right-2 flex gap-1">
                        {votersForThisPlayer.map(([voterId]) => {
                          const voter = players.find((pl) => pl.id === voterId);
                          if (!voter) return null;
                          return (
                            <div
                              key={voterId}
                              style={{ backgroundColor: PLAYER_COLORS[voter.color].hex }}
                              className="h-4 w-4 rounded-full border border-black shadow"
                              title={`Voted by ${voter.name}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Skip Vote Bar */}
            <div className="mt-4 flex items-center justify-between border-2 border-slate-800 bg-slate-900 p-2">
              <span className="font-pixel text-[9px] text-slate-400">SKIP VOTING</span>
              {!localPlayer.isDead && votingPhase === 'voting' && !hasPlayerVoted ? (
                <button
                  onClick={() => handleCastVote('skip')}
                  className="cursor-pointer border border-amber-500 bg-amber-700/80 px-3 py-1 font-pixel text-[8px] hover:bg-amber-600 active:scale-95"
                >
                  SKIP VOTE
                </button>
              ) : votes[localPlayer.id] === 'skip' ? (
                <span className="font-pixel text-[8px] text-amber-400">SKIPPED</span>
              ) : null}
            </div>
          </div>

          {/* Chat Panel (Right) */}
          <div className="flex w-full md:w-80 flex-col bg-slate-900/60 p-3">
            <div className="mb-2 font-pixel text-[9px] text-slate-400">CREW LOG &amp; CHAT</div>

            {/* Message Feed */}
            <div
              ref={chatScrollRef}
              className="flex-1 space-y-2 overflow-y-auto pr-1 text-xs"
            >
              {messages.map((m) => {
                const color = PLAYER_COLORS[m.senderColor];
                return (
                  <div key={m.id} className="rounded bg-black/50 p-2 border border-slate-800">
                    <div className="flex items-center gap-1 font-pixel text-[8px]">
                      <span style={{ color: color.hex }}>{m.senderName}:</span>
                    </div>
                    <div className="mt-1 font-retro text-xs text-slate-200">
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Chat Buttons */}
            <div className="mt-2 flex flex-wrap gap-1">
              {['Where?', 'Who is sus?', 'I was in Admin', 'Skip vote'].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    if (!localPlayer.isDead) {
                      addMessage(localPlayer, prompt);
                      audio.playTaskStep();
                    }
                  }}
                  className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-retro text-[9px] text-slate-300 hover:border-slate-500 hover:bg-slate-700"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <form onSubmit={handleSendMessage} className="mt-2 flex gap-1">
              <input
                type="text"
                disabled={localPlayer.isDead}
                placeholder={localPlayer.isDead ? 'GHOSTS CANNOT SPEAK' : 'Type to discuss...'}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 border border-slate-700 bg-black px-2 py-1 font-retro text-xs text-white placeholder-slate-600 focus:border-sky-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={localPlayer.isDead}
                className="border border-slate-600 bg-slate-800 px-3 font-pixel text-[8px] hover:bg-slate-700 active:scale-95 disabled:opacity-40"
              >
                SEND
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
