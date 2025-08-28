<img width="2790" height="849" alt="ivr-navigation" src="https://github.com/user-attachments/assets/b23ca791-9339-4983-8bf9-d3c9ae9fbef3" />

# IVR Navigator Agent

Never wait on hold again. Clone this repo to deploy AI agents that will patiently sit through endless elevator music, navigate confusing phone menus, and endure "your call is important to us" messages on your behalf. When they finally reach a human, they'll seamlessly transfer the call to you - because your time is too valuable to spend listening to hold music.

Built with Conversational AI by ElevenLabs.

## Quick Start

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/yourusername/ivr-navigator-agent.git
   cd ivr-navigator-agent
   pnpm install
   ```

2. **Set up your environment:**

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and replace `your_api_key_here` with your ElevenLabs API key.

3. **Configure your phone number:**
   Edit `agent_prompts/ivr-navigator-agent.md` and add your phone number at the end of line 99 where it says "Once you have detected you have reached a human, you must transfer the call to"

4. **Process and deploy:**

   ```bash
   # Process agent prompts
   pnpm run agents:prompts

   # Sync agents to production
   pnpm run agents:sync
   ```

## Directory Structure

- `agent_configs/` - JSON configuration files for agents (organized by environment: prod, dev, staging)
- `agent_prompts/` - Markdown files containing agent prompts
- `scripts/` - Utility scripts to move the prompts from .md -> .json in the `agent_configs` folder
- `agents.json` - Main agents configuration file

Explore the ElevenLabs CLI [here](https://elevenlabs.io/docs/conversational-ai/libraries/agents-cli) for more details.
