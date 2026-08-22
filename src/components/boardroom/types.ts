export type FacialExpression = 'neutral' | 'smiling' | 'thinking' | 'agreeing' | 'curious' | 'serious';

export interface Panelist {
  id: number;
  name: string;
  role: string;
  focus: string;
  bio: string;
  avatarUrl: string;
  accentColor: string;
  avatarVisuals: {
    skin: string;
    lips: string;
    irisColor: string;
    eyeWidth: number;
    eyeHeight: number;
    mouthWidth: number;
    mouthHeight: number;
  };
}

export type SidebarTab = 'answer' | 'coach' | 'scorecard' | 'notepad' | 'participants' | null;

export type CandidateInputMode = 'write' | 'mic';

export interface DynamicCoachFeedback {
  concepts: string[];
  starSituation: string;
  starAction: string;
  focusHint: string;
}
