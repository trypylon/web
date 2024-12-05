import { z } from "zod";
import { Brain } from "lucide-react";
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
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { handleLLMInputs } from "@/lib/llm";
import { handleJsonOutput } from "@/lib/json";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { createDebugLog } from "@/lib/debug";

interface ExtendedNodeData extends NodeData {
  _debugLogs?: DebugLog[];
}

export const MetaNode: BaseNode = {
  id: "meta",
  type: "Meta",
  category: NodeCategory.LLM,
  name: "Meta",
  description: "Meta's language models like Llama 2 and CodeLlama",
  icon: Brain,
  version: "1.0.0",
  role: NodeRole.EXECUTOR,
  parameters: [
    {
      name: "model",
      label: "Model",
      type: "select",
      options: [
        { label: "Llama 2 70B", value: "llama2:70b-chat" },
        { label: "Llama 2 13B", value: "llama2:13b-chat" },
        { label: "Llama 2 7B", value: "llama2:7b-chat" },
        { label: "CodeLlama 34B", value: "codellama:34b-instruct" },
        { label: "CodeLlama 13B", value: "codellama:13b-instruct" },
        { label: "CodeLlama 7B", value: "codellama:7b-instruct" },
      ],
      default: "llama2:7b-chat",
      description: "The Meta model to use",
    },
    {
      name: "temperature",
      label: "Temperature",
      type: "number",
      default: 0.7,
      optional: true,
      description: "Controls randomness (0-1)",
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
    },
  ],
  credentials: [
    {
      name: "ollamaUrl",
      required: false,
      description: "Your Ollama API URL (defaults to http://localhost:11434)",
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
    const model = nodeData.parameters.model || "llama2:7b-chat";
    const temperature = nodeData.parameters.temperature || 0.7;

    const llm = new ChatOllama({
      model,
      temperature,
      baseUrl: options.credentials?.OLLAMA_URL || "http://localhost:11434",
      maxRetries: 3,
    });

    return { llm };
  },

  async execute(
    instance: {
      llm: ChatOllama;
    },
    nodeData?: NodeData,
    inputs?: Record<InputType, string>
  ) {
    console.log("Meta execute called with inputs:", inputs);

    const updatedNodeData = { ...nodeData } as ExtendedNodeData;
    const debugLogs: DebugLog[] = [];
    const promptText = inputs?.prompt || nodeData?.parameters?.prompt || "";

    // Use common input handler
    const {
      template,
      inputValues,
      debugLogs: inputDebugLogs,
    } = await handleLLMInputs({
      inputs,
      promptText,
      debugLogs: [],
      llm: instance.llm as unknown as BaseLanguageModel,
    });

    debugLogs.push(...inputDebugLogs);

    // Create and format the prompt
    const promptTemplate = PromptTemplate.fromTemplate(template);
    const formattedPrompt = await promptTemplate.format(inputValues);

    debugLogs.push(
      createDebugLog("intermediate", "Final Formatted Prompt", formattedPrompt)
    );

    // Get response from LLM
    let response;
    const useJsonOutput = nodeData?.parameters?.useJsonOutput || false;
    const jsonSchema = nodeData?.parameters?.jsonSchema;

    if (useJsonOutput && jsonSchema) {
      // Handle JSON output
      const jsonResponse = await handleJsonOutput({
        llm: instance.llm as unknown as BaseLanguageModel,
        jsonSchema,
        prompt: formattedPrompt,
        debugLogs: [],
      });
      response = jsonResponse.response;
      debugLogs.push(...jsonResponse.debugLogs);
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
