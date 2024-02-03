export interface PizzaEvaluation {
  isPizza: boolean;
  quality: number;
  positives: string[];
  negatives: string[];
  matchesDescription: boolean;
  mismatchReason: string;
}
