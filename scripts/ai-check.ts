import "../src/lib/env";
import { getAiConfigurationSummary, getChatProvider, getEmbeddingProvider } from "../src/lib/ai/provider";

async function main() {
  const config = getAiConfigurationSummary();
  console.log("AI configuration");
  console.log(`  Chat:       ${config.chat.provider} (${config.chat.model})`);
  console.log(`  Embeddings: ${config.embeddings.provider} (${config.embeddings.model})`);

  const embeddings = getEmbeddingProvider();
  if (embeddings.name === "disabled") {
    console.log("\nEmbedding check: skipped (disabled). Ask Ugbanawaji will use keyword retrieval.");
  } else {
    const result = await embeddings.embedMany(["portfolio retrieval health check"]);
    const vector = result[0];
    if (!vector?.length) throw new Error("Embedding provider returned no vector");
    console.log(`\nEmbedding check: OK (${vector.length} dimensions)`);
  }

  const chat = getChatProvider();
  if (chat.name === "disabled") {
    console.log("Chat check: skipped (disabled). Evidence retrieval still works, but generated answers are unavailable.");
  } else {
    const response = await chat.generate({
      system: "You are a health-check endpoint. Follow the user instruction exactly and answer briefly.",
      user: "Reply with exactly: OK",
    });
    console.log(`Chat check: OK (${response.slice(0, 120)})`);
  }
}

main().catch((error) => {
  console.error("\nAI provider check failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
