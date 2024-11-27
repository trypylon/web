import { z } from "zod";
import { Database } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeInitOptions,
} from "@/types/nodes";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone, Index, IndexList } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { HuggingFaceTransformersEmbeddings } from "@langchain/huggingface-transformers";

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
        return Array.from(indexes).map((index: Index) => ({
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
        { label: "OpenAI Ada (1536)", value: 1536 },
        { label: "Standard (1024)", value: 1024 },
        { label: "OpenAI Small (384)", value: 384 },
        { label: "Custom 768", value: 768 },
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
    {
      name: "pineconeEnvironment",
      required: true,
      description: "Your Pinecone environment",
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
      }),
    },
  ],

  async initialize(nodeData: NodeData) {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const index = pinecone.Index(nodeData.parameters.indexName);

    // Get dimensions from either select or custom input
    const dimensions =
      nodeData.parameters.dimensions === "custom"
        ? nodeData.parameters.customDimensions
        : parseInt(nodeData.parameters.dimensions);

    const embeddings = {
      embedQuery: async (text: string) => {
        const response = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: text,
            model: "text-embedding-ada-002",
            dimensions: dimensions,
          }),
        });

        const result = await response.json();
        return result.data[0].embedding;
      },
    };

    return {
      indexName: nodeData.parameters.indexName,
      namespace: nodeData.parameters.namespace,
      topK: nodeData.parameters.topK || 3,
      index,
      embeddings,
      dimensions,
    };
  },

  async execute() {
    // Config-only node, no execution needed
    return "";
  },
};
