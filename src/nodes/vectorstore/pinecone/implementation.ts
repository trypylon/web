import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PineconeStore } from "@langchain/pinecone";
import { NodeInitOptions } from "@/types/nodes";

export default {
  async initialize(config: any, options?: NodeInitOptions) {
    console.log("Pinecone implementation initialize called");

    // Choose embedding model based on dimensions
    let embeddings;
    const dimensions = Number(config.dimensions);

    if (dimensions === 1024) {
      embeddings = new HuggingFaceInferenceEmbeddings({
        apiKey:
          options?.credentials?.HUGGINGFACE_API_KEY ||
          process.env.HUGGINGFACE_API_KEY,
        model: "intfloat/multilingual-e5-large",
      });
    } else {
      embeddings = new OpenAIEmbeddings({
        openAIApiKey:
          options?.credentials?.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey:
        options?.credentials?.PINECONE_API_KEY || process.env.PINECONE_API_KEY,
    });

    const index = pinecone.Index(config.indexName);

    // Create vector store with the embeddings
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: config.namespace,
    });

    return {
      search: async (query: string, topK: number) => {
        console.log("Pinecone search called with query:", query);
        const docs = await vectorStore.similaritySearch(query, topK);
        return { docs };
      },
    };
  },
};
