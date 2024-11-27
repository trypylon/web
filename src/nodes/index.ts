import { OpenAINode } from "./llm/openai/schema";
import { AnthropicNode } from "./llm/anthropic/schema";
import { PineconeVectorStoreNode } from "./vectorstore/pinecone/schema";
import { BaseNode } from "@/types/nodes";

export const registeredNodes: BaseNode[] = [
  OpenAINode,
  AnthropicNode,
  PineconeVectorStoreNode,
];
