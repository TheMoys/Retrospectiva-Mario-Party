import React from 'react';
import { useGame } from '@/context/GameContext';
import { BlockSmashMinigame } from './BlockSmashMinigame';
import { QuickVoteMinigame } from './QuickVoteMinigame';
import { BlindTimerMinigame } from './BlindTimerMinigame';
import { PlanningPokerMinigame } from './PlanningPokerMinigame';
import { SimonPipelineMinigame } from './SimonPipelineMinigame';
import { DefuseCableMinigame } from './DefuseCableMinigame';
import { ChickenMeetingMinigame } from './ChickenMeetingMinigame';
import { PriceIsRightMinigame } from './PriceIsRightMinigame';
import { SprintRhythmMinigame } from './SprintRhythmMinigame';
import { StroopBugMinigame } from './StroopBugMinigame';

interface ActiveMinigameRendererProps {
  isController: boolean;
}

export const ActiveMinigameRenderer: React.FC<ActiveMinigameRendererProps> = ({ isController }) => {
  const { gameState } = useGame();
  const { phase, minigame } = gameState;

  if (phase !== 'minigame' || !minigame || minigame.phase === 'roulette') {
    return null;
  }

  switch (minigame.type) {
    case 'block_smash':
      return <BlockSmashMinigame isController={isController} />;
    case 'quick_vote':
      return <QuickVoteMinigame isController={isController} />;
    case 'blind_timer':
      return <BlindTimerMinigame isController={isController} />;
    case 'planning_poker':
      return <PlanningPokerMinigame isController={isController} />;
    case 'simon_pipeline':
      return <SimonPipelineMinigame isController={isController} />;
    case 'defuse_p0':
      return <DefuseCableMinigame isController={isController} />;
    case 'chicken_meeting':
      return <ChickenMeetingMinigame isController={isController} />;
    case 'dev_price_is_right':
      return <PriceIsRightMinigame isController={isController} />;
    case 'sprint_rhythm':
      return <SprintRhythmMinigame isController={isController} />;
    case 'stroop_bug':
      return <StroopBugMinigame isController={isController} />;
    default:
      return null;
  }
};
