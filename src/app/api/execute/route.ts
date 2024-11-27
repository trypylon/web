import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Node, Edge } from "reactflow";
import { ExecutionStep } from "@/components/ExecutionLog";
import { getNodeByType } from "@/nodes";
import { InputType } from "@/types/nodes";

// Build execution graph
function buildExecutionGraph(nodes: Node[], edges: Edge[]) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const inDegree = new Map<string, number>();
  const levels = new Map<string, number>();

  // Initialize maps
  nodes.forEach((node) => {
    inDegree.set(node.id, 0);
    levels.set(node.id, 0);
  });

  // Calculate in-degrees
  edges.forEach((edge) => {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // Calculate levels using topological sort
  const queue = nodes
    .filter((node) => (inDegree.get(node.id) || 0) === 0)
    .map((node) => node.id);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentLevel = levels.get(currentId) || 0;

    const outgoingEdges = edges.filter((edge) => edge.source === currentId);
    for (const edge of outgoingEdges) {
      levels.set(
        edge.target,
        Math.max(levels.get(edge.target) || 0, currentLevel + 1)
      );

      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) - 1);
      if (inDegree.get(edge.target) === 0) {
        queue.push(edge.target);
      }
    }
  }

  // Group nodes by level for parallel execution
  const executionLevels = new Map<number, string[]>();
  nodes.forEach((node) => {
    const level = levels.get(node.id) || 0;
    if (!executionLevels.has(level)) {
      executionLevels.set(level, []);
    }
    executionLevels.get(level)?.push(node.id);
  });

  return { executionLevels, nodeMap };
}

// Get node inputs from incoming edges
function getNodeInputs(
  nodeId: string,
  edges: Edge[],
  results: Map<string, string>
): Record<InputType, string> {
  const inputs: Partial<Record<InputType, string>> = {};

  edges
    .filter((edge) => edge.target === nodeId)
    .forEach((edge) => {
      const sourceResult = results.get(edge.source);
      if (sourceResult && edge.targetHandle) {
        inputs[edge.targetHandle as InputType] = sourceResult;
      }
    });

  return inputs as Record<InputType, string>;
}

// Execute a single node
async function executeNode(
  node: Node,
  inputs: Record<InputType, string>,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
  stepId: string
) {
  const schemaNode = getNodeByType(node.data.type);
  if (!schemaNode) {
    throw new Error(`Unknown node type: ${node.data.type}`);
  }

  // Skip execution logging for config-only nodes
  if (!schemaNode.execute) {
    const instance = await schemaNode.initialize(node.data, {});
    return JSON.stringify(instance);
  }

  const startTime = Date.now();

  try {
    // Update step status to running
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: "step",
          step: {
            id: stepId,
            nodeId: node.id,
            nodeName: node.data.label,
            status: "running",
            startTime,
          },
        })}\n\n`
      )
    );

    const instance = await schemaNode.initialize(node.data, {});
    const result = await schemaNode.execute(instance, node.data, inputs);
    const endTime = Date.now();

    // Get debug logs if they were attached to nodeData
    const debugLogs = node.data._debugLogs;

    // Update step status to completed with timing information and debug logs
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: "step",
          step: {
            id: stepId,
            nodeId: node.id,
            nodeName: node.data.label,
            status: "completed",
            result,
            startTime,
            endTime,
            debugLogs,
          },
        })}\n\n`
      )
    );

    return result;
  } catch (error: any) {
    const endTime = Date.now();
    const debugLogs = node.data._debugLogs;

    // Update step status to error with timing information and debug logs
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: "step",
          step: {
            id: stepId,
            nodeId: node.id,
            nodeName: node.data.label,
            status: "error",
            error: error.message,
            startTime,
            endTime,
            debugLogs,
          },
        })}\n\n`
      )
    );
    throw error;
  }
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  try {
    const { nodes, edges, executionSteps } = await request.json();

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      throw new Error("Invalid request body structure");
    }

    // Create a new ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const { executionLevels, nodeMap } = buildExecutionGraph(
            nodes,
            edges
          );
          const results = new Map<string, string>();

          // Execute nodes level by level
          const levels = Array.from(executionLevels.keys()).sort();

          for (const level of levels) {
            if (request.signal?.aborted) {
              throw new Error("Execution aborted");
            }

            const nodesInLevel = executionLevels.get(level) || [];

            await Promise.all(
              nodesInLevel.map(async (nodeId) => {
                const node = nodeMap.get(nodeId);
                if (!node) return;

                // Skip nodes without execute function
                const schemaNode = getNodeByType(node.data.type);
                if (!schemaNode?.execute) {
                  const instance = await schemaNode?.initialize(node.data, {});
                  results.set(nodeId, JSON.stringify(instance));
                  return;
                }

                const stepId =
                  executionSteps.find(
                    (step: ExecutionStep) => step.nodeId === nodeId
                  )?.id || uuidv4();

                // Get inputs from incoming edges
                const inputs = getNodeInputs(nodeId, edges, results);

                try {
                  const result = await executeNode(
                    node,
                    inputs,
                    encoder,
                    controller,
                    stepId
                  );
                  results.set(nodeId, result);
                } catch (error) {
                  console.error(`Error executing node ${nodeId}:`, error);
                }
              })
            );
          }

          // Signal completion
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`)
          );
        } catch (error: any) {
          if (error.name === "AbortError") {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  error: "Execution aborted by user",
                })}\n\n`
              )
            );
          } else {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  error: error.message,
                })}\n\n`
              )
            );
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error.message || "An unexpected error occurred during flow execution",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
