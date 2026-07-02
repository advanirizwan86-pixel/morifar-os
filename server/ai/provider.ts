import "server-only";

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiCompletion = {
  content: string;
  model: string;
  provider: string;
};

export interface AiProvider {
  complete(messages: AiMessage[]): Promise<AiCompletion>;
}

class RuleBasedMockProvider implements AiProvider {
  async complete(messages: AiMessage[]): Promise<AiCompletion> {
    const prompt = messages.map(message => message.content).join("\n").toLowerCase();
    const topic = prompt.includes("approval") ? "approval risk" : prompt.includes("task") ? "work prioritisation" : "operations";
    return {
      content: `AI-generated ${topic} guidance based on current Morifar OS records. Review the supporting data before acting.`,
      model: "morifar-rule-mock-v1",
      provider: "mock",
    };
  }
}

export function getAiProvider(): AiProvider {
  return new RuleBasedMockProvider();
}
