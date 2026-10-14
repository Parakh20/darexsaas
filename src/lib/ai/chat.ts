import { GoogleGenerativeAI, FunctionCallingMode } from "@google/generative-ai";
import { ALL_TOOLS } from "./tools";
import type { ToolContext } from "./tools/types";
import { prisma } from "@/lib/prisma";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SYSTEM_PROMPT = `You are an AI Business Operations Agent for a CRM and sales platform.
You help users manage their contacts, opportunities, tasks, and communications.
When taking actions (creating tasks, sending WhatsApp, updating opportunities), always confirm what you did.
Explain your reasoning briefly so users understand why you made each decision.
Be concise and action-oriented.`;

function toGeminiTools() {
  return ALL_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters as unknown as import("@google/generative-ai").FunctionDeclarationSchema,
  }));
}

export async function* streamChat(
  conversationId: string,
  userMessage: string,
  context: ToolContext
): AsyncGenerator<string> {
  const model = genai.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: toGeminiTools() }],
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
  });

  // Fetch conversation history
  const history = await prisma.chatMessage.findMany({
    where: { chatConversationId: conversationId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const geminiHistory = history
    .filter((m) => m.role !== "TOOL")
    .map((m) => ({
      role: m.role === "USER" ? "user" as const : "model" as const,
      parts: [{ text: m.content }],
    }));

  const chat = model.startChat({ history: geminiHistory });

  // Save user message
  await prisma.chatMessage.create({
    data: { chatConversationId: conversationId, role: "USER", content: userMessage },
  });

  let result = await chat.sendMessageStream(userMessage);
  let fullResponse = "";
  const toolCallLog: unknown[] = [];

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullResponse += text;
      yield text;
    }
  }

  // Handle tool calls
  let response = await result.response;
  let iterations = 0;
  while (response.functionCalls() && iterations < 5) {
    iterations++;
    const calls = response.functionCalls()!;
    const toolResults = [];

    for (const call of calls) {
      const tool = ALL_TOOLS.find((t) => t.name === call.name);
      if (!tool) {
        toolResults.push({ name: call.name, response: { error: "Tool not found" } });
        continue;
      }
      try {
        const toolResult = await (tool.execute as (args: unknown, ctx: ToolContext) => Promise<unknown>)(call.args, context);
        toolCallLog.push({ tool: call.name, args: call.args, result: toolResult });
        toolResults.push({ name: call.name, response: { result: JSON.stringify(toolResult) } });
        const toolResultText = `\n[Tool: ${call.name}] → ${JSON.stringify(toolResult, null, 2)}\n`;
        yield toolResultText;
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        toolResults.push({ name: call.name, response: { error } });
        yield `\n[Tool: ${call.name}] Error: ${error}\n`;
      }
    }

    result = await chat.sendMessageStream(toolResults.map((tr) => ({
      functionResponse: { name: tr.name, response: tr.response },
    })));

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullResponse += text;
        yield text;
      }
    }
    response = await result.response;
  }

  // Save assistant message with tool call log
  await prisma.chatMessage.create({
    data: {
      chatConversationId: conversationId,
      role: "ASSISTANT",
      content: fullResponse,
      toolCalls: toolCallLog.length > 0 ? toolCallLog as unknown as import("@prisma/client").Prisma.InputJsonValue : undefined,
    },
  });
}
