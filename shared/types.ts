// Ön yüz ve arka uç arasında paylaşılan tipler.

export type ToolId = 'rol' | 'birebir' | 'gelisim' | 'maas' | 'yol' | 'ton' | 'terfi';
export type Plan = 'trial' | 'sub' | 'expired';

export interface Me {
  id: string;
  ageConfirmed: boolean;
  role: string | null;
  sector: string | null;
  experience: string | null;
  needs: string[];
  ageRange: string | null;
  companySize: string | null;
  manages: string | null;
  city: string | null;
  /** İsteğe bağlı ikinci kayıt adımı tamamlandı veya atlandı mı? */
  extraDone: boolean;
  plan: Plan;
  trialEndsAt: number;
  subUntil: number;
  cvCredits: number;
  usedToday: number;
  dailyLimit: number;
}

export interface Win {
  id: string;
  text: string;
  tags: string[];
  createdAt: number;
}

export interface SafetyNotice {
  kind: 'crisis' | 'legal';
  text: string;
}

export interface RolOutput {
  written: string[];
  unwritten: string[];
  plan: { phase: string; title: string; actions: string[] }[];
  askManager: string[];
}
export interface BirebirOutput {
  goal: string;
  agenda: { title: string; detail: string; minutes: number }[];
  opening: string;
  objections: { objection: string; response: string }[];
}
export interface GelisimOutput {
  skills: { name: string; now: number; target: number; why: string }[];
  monthPlan: { week: string; task: string }[];
}
export interface MaasOutput {
  reasons: string[];
  script: string;
  ifNo: string[];
  prep: string[];
}
export interface YolOutput {
  steps: { title: string; detail: string }[];
  thisWeek: { title: string; detail: string; draftMessage: string };
}
export interface TonOutput {
  assessment: string;
  risks: string[];
  rewritten: string;
}
export interface TerfiOutput {
  summary: string;
  achievements: { title: string; impact: string }[];
  competencies: string[];
  gaps: string[];
  nextSteps: string[];
}
export interface ToolOutputs {
  rol: RolOutput;
  birebir: BirebirOutput;
  gelisim: GelisimOutput;
  maas: MaasOutput;
  yol: YolOutput;
  ton: TonOutput;
  terfi: TerfiOutput;
}

export interface ProvaTurn {
  role: 'user' | 'counterpart';
  text: string;
}
export interface ProvaOutput {
  reply: string;
  coachNote: { feedback: string; better: string } | null;
}

export interface CvOutput {
  score: number;
  metrics: { keywords: number; format: number; sections: number; impact: number };
  missingKeywords: string[];
  tips: { title: string; body: string; gain: number }[];
}

/** API cevabı: ya araç çıktısı ya da güvenlik yönlendirmesi döner. */
export type AiResult<T> =
  | { ok: true; output: T; notice: SafetyNotice | null }
  | { ok: false; notice: SafetyNotice };
