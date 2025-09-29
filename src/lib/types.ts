export interface WordCharacter {
  character: string;
  pinyin: string;
  definition: string;
  audio: string;
}

export interface WordCollocation {
  collocation: string;
  translation: string;
  audio: string;
}

export interface WordExample {
  sentence: string;
  pinyin: string;
  translation: string;
  audio: string;
}

export interface WordResponse {
  id: number;
  pinyin: string;
  definition: string;
  examples: WordExample[];
  collocations: WordCollocation[];
  characters: WordCharacter[];
}

export interface WordSummary {
  id: number;
  pinyin: string;
  definition: string;
}
