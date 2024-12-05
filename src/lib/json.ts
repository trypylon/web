import { z } from "zod";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { ChatOpenAI } from "@langchain/openai";
import {
  JsonOutputFunctionsParser,
  StructuredOutputParser,
} from "langchain/output_parsers";
import { DebugLog } from "@/types/nodes";
import { createDebugLog } from "@/lib/debug";

interface JsonOutputOptions {
  llm: BaseLanguageModel;
  jsonSchema: any;
  prompt: string;
  debugLogs: DebugLog[];
}

interface JsonOutputResponse {
  response: any;
  debugLogs: DebugLog[];
}

// Helper function to convert JSON schema to Zod schema
function convertJsonSchemaToZod(jsonSchema: any): z.ZodObject<any> {
  const properties = jsonSchema.parameters?.properties || {};
  const required = jsonSchema.parameters?.required || [];

  const zodSchema: Record<string, z.ZodType> = {};

  for (const [key, value] of Object.entries(properties)) {
    const prop = value as any;
    switch (prop.type) {
      case "string":
        zodSchema[key] = z.string();
        break;
      case "number":
        zodSchema[key] = z.number();
        break;
      case "boolean":
        zodSchema[key] = z.boolean();
        break;
      case "array":
        zodSchema[key] = z.array(z.string());
        break;
      case "object":
        zodSchema[key] = z.record(z.string());
        break;
      default:
        zodSchema[key] = z.any();
    }

    if (!required.includes(key)) {
      zodSchema[key] = zodSchema[key].optional();
    }
  }

  return z.object(zodSchema);
}

// Type guard to check if a model is ChatOpenAI
function isChatOpenAI(model: BaseLanguageModel): boolean {
  return model instanceof ChatOpenAI;
}

// Handle JSON output for OpenAI models using function calling
async function handleOpenAIJsonOutput({
  llm,
  jsonSchema,
  prompt,
  debugLogs,
}: JsonOutputOptions): Promise<JsonOutputResponse> {
  if (!isChatOpenAI(llm)) {
    throw new Error("OpenAI JSON output handler requires a ChatOpenAI model");
  }

  const outputParser = new JsonOutputFunctionsParser();
  // Cast to unknown first to avoid type intersection issues
  const openAIModel = llm as unknown as ChatOpenAI;
  const llmWithFunctions = openAIModel.bind({
    functions: [jsonSchema],
    function_call: { name: jsonSchema.name },
  });

  const response = await llmWithFunctions.pipe(outputParser).invoke(prompt);

  debugLogs.push(createDebugLog("output", "Formatted JSON Response", response));

  return { response, debugLogs };
}

// Handle JSON output for other models using structured output parser
async function handleStructuredJsonOutput({
  llm,
  jsonSchema,
  prompt,
  debugLogs,
}: JsonOutputOptions): Promise<JsonOutputResponse> {
  const zodSchema = convertJsonSchemaToZod(jsonSchema);
  const outputParser = StructuredOutputParser.fromZodSchema(zodSchema);

  // Add format instructions to the prompt
  const formatInstructions = outputParser.getFormatInstructions();
  const template = `${prompt}\n\n${formatInstructions}`;

  try {
    // Get raw response from LLM
    const llmResponse = await llm.invoke(template);
    const content =
      typeof llmResponse === "string" ? llmResponse : llmResponse.content;
    debugLogs.push(createDebugLog("intermediate", "Raw LLM Response", content));

    // Parse the response into structured output
    const parsedResponse = await outputParser.parse(content);
    debugLogs.push(
      createDebugLog("output", "Parsed JSON Response", parsedResponse)
    );

    return { response: parsedResponse, debugLogs };
  } catch (error) {
    console.error("Error parsing JSON response:", error);
    debugLogs.push(createDebugLog("intermediate", "JSON Parsing Error", error));

    // Return the raw response if parsing fails
    const rawResponse = await llm.invoke(prompt);
    const content =
      typeof rawResponse === "string" ? rawResponse : rawResponse.content;
    return { response: content, debugLogs };
  }
}

// Main function to handle JSON output across different models
export async function handleJsonOutput(
  options: JsonOutputOptions
): Promise<JsonOutputResponse> {
  const { llm } = options;

  // Use function calling for OpenAI models
  if (isChatOpenAI(llm)) {
    return handleOpenAIJsonOutput(options);
  }

  // Use structured output parser for other models
  return handleStructuredJsonOutput(options);
}
