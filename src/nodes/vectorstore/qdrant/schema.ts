import { z } from "zod";
import { Database } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeRole,
  OutputType,
} from "@/types/nodes";

export const QdrantVectorStoreNode: BaseNode = {
  id: "qdrant-vectorstore",
  type: "QdrantVectorStore",
  category: NodeCategory.VECTORSTORE,
  name: "Qdrant",
  description: "Configure Qdrant vector store for RAG",
  icon: Database,
  version: "1.0.0",
  role: NodeRole.CONFIG,
  parameters: [
    {
      name: "collectionName",
      label: "Collection Name",
      type: "string",
      description: "Name of your Qdrant collection",
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
      description: "Vector dimensions of your Qdrant collection",
    },
    {
      name: "url",
      label: "Qdrant URL",
      type: "string",
      description: "Your Qdrant instance URL",
      default: "https://your-instance.qdrant.tech",
      validation: z.string().url(),
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
      name: "QDRANT_API_KEY",
      required: true,
      description: "Your Qdrant API key",
    },
  ],
  inputs: {},
  outputs: {
    [OutputType.VECTORSTORE_CONFIG]: {
      description: "Qdrant vector store configuration",
      schema: z.object({
        collectionName: z.string(),
        url: z.string().url(),
        topK: z.number(),
        dimensions: z.number(),
      }),
    },
  },

  async initialize(nodeData: NodeData) {
    return {
      type: "qdrant",
      collectionName: nodeData.parameters.collectionName,
      url: nodeData.parameters.url,
      topK: nodeData.parameters.topK || 3,
      dimensions: parseInt(nodeData.parameters.dimensions || "1536"),
    };
  },
};
