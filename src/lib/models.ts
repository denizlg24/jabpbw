export interface ModelDef {
  id: string;
  name: string;
  inputPricePerMTok: number;
  outputPricePerMTok: number;
}

export const MODELS: ModelDef[] = [
  {
    id: "claude-sonnet-4-5-20250929",
    name: "Sonnet 4.5",
    inputPricePerMTok: 3,
    outputPricePerMTok: 15,
  },
  {
    id: "claude-opus-4-6",
    name: "Opus 4.6",
    inputPricePerMTok: 5,
    outputPricePerMTok: 25,
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Haiku 4.5",
    inputPricePerMTok: 1,
    outputPricePerMTok: 5,
  },
];

export const DEFAULT_MODEL = MODELS[0]!;

export function getModelDef(modelId: string): ModelDef {
  return MODELS.find((m) => m.id === modelId) ?? DEFAULT_MODEL;
}

export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const model = getModelDef(modelId);
  return (
    (inputTokens / 1_000_000) * model.inputPricePerMTok +
    (outputTokens / 1_000_000) * model.outputPricePerMTok
  );
}
