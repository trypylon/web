export interface APICredential {
  key: APIKeyType;
  value: string;
  created_at?: string;
  updated_at?: string;
}

export enum APIKeyType {
  OPENAI = "OPENAI_API_KEY",
  ANTHROPIC = "ANTHROPIC_API_KEY",
  PINECONE = "PINECONE_API_KEY",
  QDRANT = "QDRANT_API_KEY",
  HUGGINGFACE = "HUGGINGFACE_API_KEY",
  COHERE = "COHERE_API_KEY",
  META = "OLLAMA_URL",
}

export const API_KEY_LABELS: Record<APIKeyType, string> = {
  [APIKeyType.OPENAI]: "OpenAI API Key",
  [APIKeyType.ANTHROPIC]: "Anthropic API Key",
  [APIKeyType.PINECONE]: "Pinecone API Key",
  [APIKeyType.QDRANT]: "Qdrant API Key",
  [APIKeyType.HUGGINGFACE]: "HuggingFace API Key",
  [APIKeyType.COHERE]: "Cohere API Key",
  [APIKeyType.META]: "OLLAMA Url",
};
