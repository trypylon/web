import { z } from "zod";
import { Bot } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeInitOptions,
  InputType,
  DebugLog,
  NodeRole,
  OutputType,
} from "@/types/nodes";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { handleVectorStore } from "@/lib/llm";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { createDebugLog } from "@/lib/debug";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";

interface ExtendedNodeData extends NodeData {
  _debugLogs?: DebugLog[];
}

export const OpenAINode: BaseNode = {
  id: "openai",
  type: "OpenAI",
  category: NodeCategory.LLM,
  name: "OpenAI",
  description: "OpenAI language models like GPT-4 and GPT-3.5",
  icon: Bot,
  version: "1.0.0",
  role: NodeRole.EXECUTOR,
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
      type: "float",
      default: 0.7,
      min: 0,
      max: 1,
      step: 0.1,
      optional: true,
      description:
        "Controls randomness in the output (0 = deterministic, 1 = creative)",
      validation: z.number().min(0).max(1),
    },
    {
      name: "useJsonOutput",
      label: "Format Output as JSON",
      type: "boolean",
      default: false,
      description: "Whether to format the output as a specific JSON structure",
    },
    {
      name: "jsonSchema",
      label: "JSON Schema",
      type: "json",
      description: "The JSON schema that defines the output structure",
      conditions: [
        {
          field: "useJsonOutput",
          value: true,
        },
      ],
      default: {
        name: "generate_response",
        description: "Generate a structured response",
        parameters: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "A brief summary of the response",
            },
            points: {
              type: "array",
              items: { type: "string" },
              description: "Key points from the response",
            },
          },
          required: ["summary", "points"],
        },
      },
    },
  ],
  credentials: [
    {
      name: "openaiApiKey",
      required: true,
      description: "Your OpenAI API key",
    },
    {
      name: "huggingfaceApiKey",
      required: false,
      description:
        "Your HuggingFace API key (required for e5-large embeddings)",
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
    vectorstore: {
      required: false,
      description: "Retrieved documents from a vector store for RAG",
    },
    memory: {
      required: false,
      description: "Chat history or memory from previous interactions",
      isAdvanced: true,
    },
  },
  outputs: {
    [OutputType.TEXT]: {
      description: "The generated text response from the model",
      schema: z.string(),
    },
    [OutputType.JSON]: {
      description: "The structured JSON response from the model",
      schema: z.any(), // Dynamic schema based on user input
    },
  },

  async initialize(nodeData: NodeData, options: NodeInitOptions) {
    const model = nodeData.parameters.model || "gpt-4";
    const temperature = nodeData.parameters.temperature || 0.7;
    const useJsonOutput = nodeData.parameters.useJsonOutput || false;
    const jsonSchema = nodeData.parameters.jsonSchema;

    const llm = new ChatOpenAI({
      modelName: model,
      temperature,
      openAIApiKey:
        options.credentials?.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      maxRetries: 3,
      maxConcurrency: 1,
    });

    let outputParser = null;
    if (useJsonOutput && jsonSchema) {
      outputParser = new JsonOutputFunctionsParser();
    }

    return { llm, outputParser, jsonSchema };
  },

  async execute(
    instance: {
      llm: ChatOpenAI;
      outputParser: JsonOutputFunctionsParser | null;
      jsonSchema: any;
    },
    nodeData?: NodeData,
    inputs?: Record<InputType, string>
  ) {
    console.log("OpenAI execute called with inputs:", inputs);

    const updatedNodeData = { ...nodeData } as ExtendedNodeData;
    const debugLogs: DebugLog[] = [];
    const promptText = inputs?.prompt || nodeData?.parameters?.prompt || "";

    debugLogs.push(createDebugLog("input", "Initial Prompt", promptText));

    // Build template and variables based on available inputs
    let template = "{input}";
    const inputValues: Record<string, string> = {
      input: promptText,
    };

    if (inputs?.vectorstore) {
      console.log("Processing vectorstore input");
      const vectorStoreResponse = await handleVectorStore({
        llm: instance.llm as unknown as BaseLanguageModel<any, any>,
        vectorStoreInput: inputs.vectorstore,
        userPrompt: promptText,
        debugLogs: [],
      });

      template = vectorStoreResponse.template;
      Object.assign(inputValues, vectorStoreResponse.inputValues);
      debugLogs.push(...vectorStoreResponse.debugLogs);
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
    const promptTemplate = PromptTemplate.fromTemplate(template);
    const formattedPrompt = await promptTemplate.format(inputValues);

    debugLogs.push(
      createDebugLog("intermediate", "Final Formatted Prompt", formattedPrompt)
    );

    // Get response from LLM
    let response;
    if (instance.outputParser && instance.jsonSchema) {
      // Use function calling and JSON output parsing
      const llmWithFunctions = instance.llm.bind({
        functions: [instance.jsonSchema],
        function_call: { name: instance.jsonSchema.name },
      });

      response = await llmWithFunctions
        .pipe(instance.outputParser)
        .invoke(formattedPrompt);

      debugLogs.push(
        createDebugLog("output", "Formatted JSON Response", response)
      );
    } else {
      // Regular text response
      response = await instance.llm.invoke(formattedPrompt);
      response = response.content;

      debugLogs.push(createDebugLog("output", "LLM Response", response));
    }

    // Update the nodeData with debug logs
    updatedNodeData._debugLogs = debugLogs;
    Object.assign(nodeData || {}, { _debugLogs: debugLogs });

    return response;
  },
};
