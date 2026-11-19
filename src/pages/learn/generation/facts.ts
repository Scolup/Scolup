// A course becomes a list of facts. Each fact keeps the text it came from so
// an exercise can show its source after the answer.

export interface PairFact {
  kind: "pair"
  left: string
  right: string
  source: string
}

export interface DefinitionFact {
  kind: "definition"
  term: string
  definition: string
  source: string
}

export interface QuestionFact {
  kind: "question"
  question: string
  answer: string
}

export type Fact = PairFact | DefinitionFact | QuestionFact
