import { DebugLog, InputType } from "@/types/nodes";
import { BaseLanguageModel } from "@langchain/core/language_models/base";

export interface VectorStoreConfig {
  type: "pinecone" | "qdrant";
  indexName?: string;
  collectionName?: string;
  url?: string;
  namespace?: string;
  topK: number;
  dimensions: number;
  [key: string]: any;
}

export interface VectorStoreResult {
  docs: Array<{
    pageContent: string;
    metadata: Record<string, any>;
  }>;
}

export interface HandleVectorStoreOptions {
  llm: BaseLanguageModel;
  vectorStoreInput: string;
  userPrompt: string;
  debugLogs: DebugLog[];
}

export interface VectorStoreResponse {
  template: string;
  inputValues: Record<string, string>;
  debugLogs: DebugLog[];
}
