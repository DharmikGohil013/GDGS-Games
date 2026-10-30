import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../game/audio.ts';
import { Player, PLAYER_COLORS } from '../game/types.ts';

interface Props {
  ejectedPlayer: Player | null;
  wasTie: boolean;
  isSkip: boolean;
  impostorsLeft: number;
  onFinish: () => void;
}

export const EjectionScene: React.FC<Props> = ({
  ejectedPlayer,
  wasTie,
  isSkip,
  impostorsLeft,
  onFinish,
}) => {
  const [typedText, setTypedText] = useState('');

  let fullMessage = '';
  if (isSkip) {
    fullMessage = 'No one was ejected. (Skipped)';
  } else if (wasTie || !ejectedPlayer) {
    fullMessage = 'No one was ejected. (Tie)';
  } else {
    const roleText = ejectedPlayer.role === 'impostor' ? 'An Impostor.' : 'not An Impostor.';
    const remText =
      impostorsLeft === 1
        ? '1 Impostor remains.'
        : `${impostorsLeft} Impostors remain.`;
    fullMessage = `${ejectedPlayer.name} was ${roleText}\n${remText}`;
  }

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    audio.playEjectHum();

    // Typewriter effect
    let charIdx = 0;
    const interval = setInterval(() => {
      charIdx++;
      setTypedText(fullMessage.slice(0, charIdx));
      if (charIdx >= fullMessage.length) {
        clearInterval(interval);
      }
    }, 50);

    const finishTimeout = setTimeout(() => {
      onFinishRef.current();
    }, 3800);

    return () => {
      clearInterval(interval);
      clearTimeout(finishTimeout);
    };
  }, []);

  const color = ejectedPlayer ? PLAYER_COLORS[ejectedPlayer.color] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white select-none overflow-hidden">
      {/* Drifting Ejected Astronaut (if any) */}
      {ejectedPlayer && color && (
        <div className="absolute animate-[spin_6s_linear_infinite] [animation-duration:8s] [animation-timing-function:linear] animate-[drift_6s_ease-out_forwards]">
          <div className="relative flex flex-col items-center">
            {/* Bean body */}
            <div
              style={{ backgroundColor: color.hex }}
              className="h-16 w-12 rounded-t-2xl border-2 border-black relative"
            >
              {/* Visor */}
              <div
                style={{ backgroundColor: color.visorHex }}
                className="absolute top-2 right-1 h-5 w-7 rounded-sm border border-black"
              >
                <div className="h-1 w-2 bg-white m-0.5" />
              </div>
            </div>
            {/* Legs */}
            <div className="flex gap-1 -mt-1">
              <div
                style={{ backgroundColor: color.shadowHex }}
                className="h-6 w-4 border-2 border-black"
              />
              <div
                style={{ backgroundColor: color.hex }}
                className="h-6 w-4 border-2 border-black"
              />
            </div>
          </div>
        </div>
      )}

      {/* Retro Typewriter Message */}
      <div className="relative z-10 max-w-xl text-center px-6">
        <p className="whitespace-pre-line font-pixel text-base md:text-xl leading-relaxed text-slate-100 shadow-md">
          {typedText}
          <span className="animate-pulse">_</span>
        </p>
      </div>

      <button
        onClick={() => onFinishRef.current()}
        className="absolute bottom-6 border border-slate-700 bg-slate-900 px-4 py-1.5 font-retro text-xs text-slate-300 hover:text-white cursor-pointer active:scale-95"
      >
        PROCEED [SPACE / CLICK]
      </button>
    </div>
  );
};
