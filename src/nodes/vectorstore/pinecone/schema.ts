import { z } from "zod";
import { Database } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeRole,
  OutputType,
} from "@/types/nodes";
import { Pinecone } from "@pinecone-database/pinecone";

export const PineconeVectorStoreNode: BaseNode = {
  id: "pinecone-vectorstore",
  type: "PineconeVectorStore",
  category: NodeCategory.VECTORSTORE,
  name: "Pinecone",
  description: "Configure Pinecone vector store for RAG",
  icon: Database,
  version: "1.0.0",
  role: NodeRole.CONFIG,
  parameters: [
    {
      name: "indexName",
      label: "Index Name",
      type: "string",
      description: "Select your Pinecone index",
      validation: z.string().min(1),
    },
    {
      name: "dimensions",
      label: "Vector Dimensions",
      type: "select",
      options: [
        { label: "OpenAI Standard (1536)", value: "1536" },
        { label: "Microsoft e5-large (1024)", value: "1024" },
      ],
      default: "1536",
      description: "Vector dimensions of your Pinecone index",
    },
    {
      name: "namespace",
      label: "Namespace",
      type: "string",
      description: "Optional namespace to query",
      optional: true,
      validation: z.string().optional(),
    },
    {
      name: "topK",
      label: "Results Count",
      type: "number",
      default: 3,
      description: "Number of similar documents to return",
      validation: z.number().min(1).max(10),
    },
  ],
  credentials: [
    {
      name: "pineconeApiKey",
      required: true,
      description: "Your Pinecone API key",
    },
  ],
  inputs: {},
  outputs: {
    [OutputType.VECTORSTORE_CONFIG]: {
      description: "Pinecone vector store configuration",
      schema: z.object({
        indexName: z.string(),
        namespace: z.string().optional(),
        topK: z.number(),
        dimensions: z.number(),
      }),
    },
  },

  async initialize(nodeData: NodeData) {
    // Return the configuration with the type field
    return {
      type: "pinecone",
      indexName: nodeData.parameters.indexName,
      namespace: nodeData.parameters.namespace,
      topK: nodeData.parameters.topK || 3,
      dimensions: parseInt(nodeData.parameters.dimensions || "1536"),
    };
  },
};
