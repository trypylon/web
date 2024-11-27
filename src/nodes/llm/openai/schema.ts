import { z } from "zod";
import { Bot } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeInitOptions,
  InputType,
} from "@/types/nodes";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BaseMessage } from "@langchain/core/messages";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";

export const OpenAINode: BaseNode = {
  id: "openai",
  type: "OpenAI",
  category: NodeCategory.LLM,
  name: "OpenAI",
  description: "OpenAI language models like GPT-4 and GPT-3.5",
  icon: Bot,
  version: "1.0.0",
  parameters: [
    {
      name: "model",
      label: "Model",
      type: "select",
      options: [
        { label: "GPT-4o-Mini", value: "gpt-4o-mini" },
        { label: "GPT-4", value: "gpt-4" },
        { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
        { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
      ],
      default: "gpt-4o-mini",
      description: "The OpenAI model to use",
    },
    {
      name: "temperature",
      label: "Temperature",
      type: "number",
      default: 0.7,
      optional: true,
      description: "Controls randomness (0-2)",
      validation: z.number().min(0).max(2),
    },
    {
      name: "prompt",
      label: "System Prompt",
      type: "string",
      description: "The system prompt that guides the model behavior",
      validation: z.string().min(1),
    },
    {
      name: "useVectorStore",
      label: "Use Vector Store",
      type: "boolean",
      default: false,
      description: "Enable RAG with vector store",
    },
    {
      name: "vectorStoreIndex",
      label: "Vector Store Index",
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
      validation: z.string().optional(),
      conditions: [{ field: "useVectorStore", value: true }],
    },
    {
      name: "vectorStoreNamespace",
      label: "Vector Store Namespace",
      type: "string",
      description: "Optional namespace to query",
      optional: true,
      validation: z.string().optional(),
      conditions: [{ field: "useVectorStore", value: true }],
    },
    {
      name: "topK",
      label: "Results Count",
      type: "number",
      default: 3,
      description: "Number of similar documents to return",
      validation: z.number().min(1).max(10),
      conditions: [{ field: "useVectorStore", value: true }],
    },
  ],
  credentials: [
    {
      name: "openaiApiKey",
      required: true,
      description: "Your OpenAI API key",
    },
  ],
  inputs: {
    prompt: {
      required: false,
      description: "Dynamic prompt to override the default prompt",
    },
    context: {
      required: false,
      description: "Additional context to be injected into the prompt",
    },
    memory: {
      required: false,
      description: "Chat history or memory from previous interactions",
    },
    vectorstore: {
      required: false,
      description: "Retrieved documents from a vector store for RAG",
    },
  },
  outputs: [
    {
      type: "text",
      schema: z.string(),
    },
  ],

  async initialize(nodeData: NodeData, options: NodeInitOptions) {
    const model = nodeData.parameters.model || "gpt-4";
    const temperature = nodeData.parameters.temperature || 0.7;

    const llm = new ChatOpenAI({
      modelName: model,
      temperature,
      openAIApiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      maxConcurrency: 1,
    });

    return { llm };
  },

  async execute(
    instance: { llm: ChatOpenAI },
    nodeData?: NodeData,
    inputs?: Record<InputType, string>
  ) {
    const promptText = inputs?.prompt || nodeData?.parameters?.prompt || "";
    console.log("Initial prompt:", promptText);

    // Build template and variables based on available inputs
    let template = "{input}";
    const inputValues: Record<string, string> = {
      input: promptText,
    };

    // If vector store config is provided, initialize and use it
    if (inputs?.vectorstore) {
      console.log("Vector store input received:", inputs.vectorstore);

      try {
        const vectorStoreConfig = JSON.parse(inputs.vectorstore);
        console.log("Parsed vector store config:", vectorStoreConfig);

        // Use the vector store's embeddings with specified dimensions
        const vectorStore = await PineconeStore.fromExistingIndex(
          vectorStoreConfig.embeddings,
          {
            pineconeIndex: vectorStoreConfig.index,
            namespace: vectorStoreConfig.namespace,
            dimensions: vectorStoreConfig.dimensions,
          }
        );

        // First, use the LLM to create a better search query
        const queryGenPrompt = PromptTemplate.fromTemplate(
          `Given the following user request, generate a concise search query that would help find relevant information in a database of movies.
          Focus on key terms and concepts that would match movie descriptions.

          User Request: {input}

          Search Query:`
        );

        console.log("Generating search query...");
        const searchQuery = await instance.llm.invoke(
          await queryGenPrompt.format({ input: promptText })
        );

        console.log("Generated search query:", searchQuery.content);

        // Use the generated query to search the vector store
        console.log("Searching vector store...");
        const docs = await vectorStore.similaritySearch(
          searchQuery.content as string,
          vectorStoreConfig.topK || 3
        );

        console.log("Retrieved documents:", docs);

        if (!docs || docs.length === 0) {
          console.log("No documents found in vector store");
          // Handle the case where no documents are found
          template = `You are a helpful assistant. The user asked: {input}

Unfortunately, I couldn't find any relevant information in the database. Please provide a general response or suggest alternatives.`;
        } else {
          // Now format a response using the retrieved documents
          template = `You are a helpful assistant with access to a movie database. 
Use the following retrieved movie information to help answer the user's request.
If the retrieved movies aren't relevant or sufficient, you can suggest similar movies based on the user's intent.

Retrieved Movie Information:
{docs}

User Request: {input}

Please provide a friendly, helpful response that directly addresses the user's request.`;

          inputValues.docs = docs.map((doc) => doc.pageContent).join("\n\n");
          console.log("Formatted docs:", inputValues.docs);
        }
      } catch (error) {
        console.error("Error in vector store processing:", error);
        // Add more specific error handling
        if (error.message.includes("dimension")) {
          throw new Error(
            `Vector dimension mismatch. Your index requires ${vectorStoreConfig.dimensions} dimensions.`
          );
        }
        throw error;
      }
    }

    // Add context if available
    if (inputs?.context) {
      template = `Additional Context:\n{context}\n\n${template}`;
      inputValues.context = inputs.context;
    }

    // Add memory if available
    if (inputs?.memory) {
      template = `Conversation History:\n{memory}\n\n${template}`;
      inputValues.memory = inputs.memory;
    }

    // Create and format the prompt
    console.log("Final template:", template);
    console.log("Final input values:", inputValues);

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const formattedPrompt = await promptTemplate.format(inputValues);
    console.log("Final formatted prompt:", formattedPrompt);

    // Get response from LLM
    const response = await instance.llm.invoke(formattedPrompt);
    return response.content as string;
  },
};
