import { z } from "zod";
import { Database } from "lucide-react";
import { BaseNode, NodeCategory, NodeData } from "@/types/nodes";
import { Pinecone } from "@pinecone-database/pinecone";

export const PineconeVectorStoreNode: BaseNode = {
  id: "pinecone-vectorstore",
  type: "PineconeVectorStore",
  category: NodeCategory.VECTORSTORE,
  name: "Pinecone",
  description: "Configure Pinecone vector store for RAG",
  icon: Database,
  version: "1.0.0",
  parameters: [
    {
      name: "indexName",
      label: "Index Name",
      type: "asyncSelect",
      description: "Select your Pinecone index",
      loadOptions: async () => {
        const pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY!,
        });
        const indexes = await pinecone.listIndexes();
        return indexes?.map((index) => ({
          label: index.name,
          value: index.name,
        }));
      },
      validation: z.string().min(1),
    },
    {
      name: "dimensions",
      label: "Vector Dimensions",
      type: "select",
      options: [
        { label: "OpenAI Standard (1536)", value: 1536 },
        { label: "Microsoft e5-large (1024)", value: 1024 },
        // { label: "OpenAI Small (384)", value: 384 },
        // { label: "Custom 768", value: 768 },
      ],
      default: 1536,
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
  outputs: [
    {
      type: "vectorstore",
      schema: z.object({
        indexName: z.string(),
        namespace: z.string().optional(),
        topK: z.number(),
        dimensions: z.number(),
      }),
    },
  ],

  async initialize(nodeData: NodeData) {
    // Just return the configuration
    return {
      indexName: nodeData.parameters.indexName,
      namespace: nodeData.parameters.namespace,
      topK: nodeData.parameters.topK || 3,
      dimensions: nodeData.parameters.dimensions,
    };
  },
};
