import { z } from 'zod';
import { Database } from 'lucide-react';
import { BaseNode, NodeCategory, NodeData, NodeInitOptions, InputType } from '@/types/nodes';
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

export const PineconeVectorStoreNode: BaseNode = {
  id: 'pinecone-vectorstore',
  type: 'PineconeVectorStore',
  category: NodeCategory.VECTORSTORE,
  name: 'Pinecone',
  description: 'Production-ready vector store using Pinecone',
  icon: Database,
  version: '1.0.0',
  parameters: [
    {
      name: 'indexName',
      label: 'Index Name',
      type: 'string',
      description: 'Name of your Pinecone index',
      validation: z.string().min(1)
    },
    {
      name: 'namespace',
      label: 'Namespace',
      type: 'string',
      description: 'Optional namespace for your vectors',
      optional: true,
      validation: z.string().optional()
    },
    {
      name: 'documents',
      label: 'Documents',
      type: 'string',
      description: 'Documents to store (one per line)',
      validation: z.string()
    },
    {
      name: 'query',
      label: 'Query',
      type: 'string',
      description: 'Query to search for similar documents',
      validation: z.string()
    },
    {
      name: 'topK',
      label: 'Top K Results',
      type: 'number',
      default: 3,
      description: 'Number of similar documents to return',
      validation: z.number().min(1).max(10)
    }
  ],
  credentials: [
    {
      name: 'pineconeApiKey',
      required: true,
      description: 'Your Pinecone API key'
    },
    {
      name: 'pineconeEnvironment',
      required: true,
      description: 'Your Pinecone environment'
    }
  ],
  inputs: {
    prompt: {
      required: false,
      description: "Query to search for similar documents. Overrides the default query parameter."
    }
  },
  outputs: [
    {
      type: 'text',
      schema: z.string()
    }
  ],

  async initialize(nodeData: NodeData, options: NodeInitOptions) {
    const documents = (nodeData.parameters.documents as string)
      .split('\n')
      .filter(doc => doc.trim().length > 0);

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!
    });

    const index = pinecone.Index(nodeData.parameters.indexName);

    // Create the vector store
    const vectorStore = await PineconeStore.fromTexts(
      documents,
      documents.map((_, i) => ({ id: i.toString() })),
      embeddings,
      {
        pineconeIndex: index,
        namespace: nodeData.parameters.namespace
      }
    );

    return vectorStore;
  },

  async execute(instance: PineconeStore, nodeData?: NodeData, inputs?: Record<InputType, string>) {
    const query = inputs?.prompt || nodeData?.parameters?.query || "";
    const topK = nodeData?.parameters?.topK || 3;
    
    const results = await instance.similaritySearch(query, topK);
    return results.map(doc => doc.pageContent).join("\n\n");
  }
};