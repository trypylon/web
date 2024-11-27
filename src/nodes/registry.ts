import { OpenAINode } from './llm/openai/schema';
import { AnthropicNode } from './llm/anthropic/schema';
import { PineconeVectorStoreNode } from './vectorstore/pinecone/schema';

export const nodeRegistry = {
  name: 'Nodes',
  folders: {
    llm: {
      name: 'Language Models',
      folders: {
        openai: {
          name: 'OpenAI',
          nodes: [OpenAINode]
        },
        anthropic: {
          name: 'Anthropic',
          nodes: [AnthropicNode]
        }
      }
    },
    memory: {
      name: 'Memory',
      folders: {}
    },
    vectorstores: {
      name: 'Vector Stores',
      folders: {
        pinecone: {
          name: 'Pinecone',
          nodes: [PineconeVectorStoreNode]
        }
      }
    },
    tools: {
      name: 'Tools',
      folders: {}
    },
    output: {
      name: 'Output',
      folders: {}
    }
  }
};