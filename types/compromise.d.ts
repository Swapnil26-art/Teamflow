declare module 'compromise' {
  export interface CompromiseDateEntry {
    texts?: string;
    start?: string;
    end?: string;
    timezone?: string;
  }

  export interface CompromiseMatchJson {
    texts?: string;
    dates?: CompromiseDateEntry;
  }

  export interface CompromiseDoc {
    dates(): CompromiseDoc;
    not(tag: string): CompromiseDoc;
    text(): string;
    json(): CompromiseMatchJson[];
  }

  export interface CompromiseParser {
    (text: string): CompromiseDoc;
    extend(plugin: unknown): CompromiseParser;
  }

  const nlp: CompromiseParser;
  export default nlp;
}

declare module 'compromise-dates' {
  const datesPlugin: unknown;
  export default datesPlugin;
}