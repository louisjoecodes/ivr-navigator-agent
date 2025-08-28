#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";

interface AgentPrompt {
  prompt: string;
  llm: string;
  temperature: number;
  max_tokens: number;
  tools: any[];
  tool_ids: string[];
  mcp_server_ids: string[];
  native_mcp_server_ids: string[];
  knowledge_base: any[];
  ignore_default_personality: boolean;
  rag: {
    enabled: boolean;
    embedding_model: string;
    max_vector_distance: number;
    max_documents_length: number;
    max_retrieved_rag_chunks_count: number;
  };
  custom_llm: any | null;
}

interface AgentConfig {
  name: string;
  conversation_config: {
    asr: any;
    turn: any;
    tts: any;
    conversation: any;
    language_presets: any;
    agent: {
      first_message: string;
      language: string;
      dynamic_variables: any;
      prompt: AgentPrompt;
    };
  };
  platform_settings: any;
  tags: string[];
}

/** Recursively collect files ending with a given extension */
function listFilesRecursive(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(p, ext));
    else if (entry.isFile() && p.endsWith(ext)) out.push(p);
  }
  return out;
}

/** Strip a leading markdown H1 and optional frontmatter */
function extractPromptText(md: string): string {
  // remove YAML frontmatter if present
  const fm = /^---\s*[\s\S]*?---\s*/m;
  if (fm.test(md)) md = md.replace(fm, "");
  // remove first H1 line
  md = md.replace(/^\s*#\s+.*$/m, "");
  return md.trim();
}

/**
 * Reads markdown prompts from agent_prompts (recursively)
 * and updates corresponding JSON configs in agent_configs/<env>
 * using the SAME relative path (clean + unambiguous).
 */
function processAgentPrompts(): void {
  const agentPromptsDir = path.join(__dirname, "../agent_prompts");
  const agentConfigsDir = path.join(__dirname, "../agent_configs");

  if (!fs.existsSync(agentPromptsDir)) {
    console.log(
      "No agent_prompts directory found, skipping prompt processing."
    );
    return;
  }

  const promptFiles = listFilesRecursive(agentPromptsDir, ".md");
  if (promptFiles.length === 0) {
    console.log("No markdown files found in agent_prompts directory.");
    return;
  }

  console.log(`Processing ${promptFiles.length} prompt files...`);

  const environments = ["prod", "dev", "staging"];

  for (const env of environments) {
    const envDir = path.join(agentConfigsDir, env);
    if (!fs.existsSync(envDir)) {
      console.log(`Environment directory ${env} doesn't exist, skipping.`);
      continue;
    }

    for (const promptPath of promptFiles) {
      // relative path from agent_prompts root, without .md
      const relNoExt = path
        .relative(agentPromptsDir, promptPath)
        .replace(/\.md$/i, "");
      // config path mirrors the relative path in the env dir
      const configFile = path.join(envDir, `${relNoExt}.json`);

      if (!fs.existsSync(configFile)) {
        // OPTIONAL: fallback to legacy flat lookup by basename only
        const legacyPath = path.join(envDir, path.basename(relNoExt) + ".json");
        if (fs.existsSync(legacyPath)) {
          console.log(
            `ℹ️  Using legacy flat match for ${relNoExt} -> ${path.basename(
              legacyPath
            )} in ${env}`
          );
          updateConfigFromPrompt(promptPath, legacyPath, relNoExt, env);
        } else {
          console.log(
            `Config not found for ${relNoExt} in ${env} (expected ${path.relative(
              envDir,
              configFile
            )}), skipping.`
          );
        }
        continue;
      }

      updateConfigFromPrompt(promptPath, configFile, relNoExt, env);
    }
  }

  console.log("Prompt processing complete!");
}

function updateConfigFromPrompt(
  promptPath: string,
  configFile: string,
  displayName: string,
  env: string
): void {
  try {
    const promptContent = fs.readFileSync(promptPath, "utf8");
    const promptText = extractPromptText(promptContent);

    const configContent = fs.readFileSync(configFile, "utf8");
    const config: AgentConfig = JSON.parse(configContent);

    if (
      config.conversation_config &&
      config.conversation_config.agent &&
      config.conversation_config.agent.prompt
    ) {
      const oldPrompt = config.conversation_config.agent.prompt.prompt ?? "";
      config.conversation_config.agent.prompt.prompt = promptText;

      fs.writeFileSync(configFile, JSON.stringify(config, null, 4));

      console.log(`✅ Updated prompt for ${displayName} in ${env}`);
      const prev = String(oldPrompt).slice(0, 50);
      const next = promptText.slice(0, 50);
      console.log(`   Old: ${prev}${oldPrompt.length > 50 ? "..." : ""}`);
      console.log(`   New: ${next}${promptText.length > 50 ? "..." : ""}`);
    } else {
      console.log(
        `⚠️  Config structure unexpected for ${displayName} in ${env}, skipping.`
      );
    }
  } catch (err: any) {
    console.error(`❌ Error processing ${displayName} in ${env}:`, err.message);
  }
}

// Run the script if called directly
if (require.main === module) {
  processAgentPrompts();
}

export { processAgentPrompts };
