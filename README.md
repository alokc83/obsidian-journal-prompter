# Journal Prompter (Reverse Prompter)

**Generate creative writing prompts for journaling and short writing with AI.**

Journal Prompter is an [Obsidian](https://obsidian.md/) plugin that helps you generate thoughtful, creative writing prompts using multiple AI providers. Perfect for journaling, creative writing, or any short writing exercises.

The plugin generates prompts that invoke emotional introspection, philosophical questioning, moral ambiguity, unique settings, character flaws, hidden motives, or contradictions to push you beyond your comfort zone and encourage unexpected depth.

## ✨ Features

- **Multi-Provider Support**: Choose from 6 AI providers:
  - **OpenAI** (GPT-4o, GPT-4, GPT-3.5-turbo, etc.)
  - **Google Gemini** (Gemini 2.0, Gemini 1.5 Pro, etc.)
  - **Grok** (xAI models)
  - **Claude** (Anthropic models)
  - **Ollama** (Local/offline models)
  - **LM Studio** (Local/offline models)
- **Smart Model Selection**: Dynamically fetches available models from each provider
- **Pricing Display**: See input/output costs per 1M tokens for online models
- **Latest Models First**: Shows the 2 most recent models by default, with option to view all
- **Clean Interface**: Simplified settings focused on what matters
- **Simple & Direct**: Generates prompts directly - no text selection needed

## 🚀 Installation

### Automatic (Coming Soon)

Install from [Obsidian Community Plugins](https://help.obsidian.md/Extending+Obsidian/Community+plugins) by searching for "Journal Prompter" or "Reverse Prompter".

### Manual Installation

1. Download the [latest release](https://github.com/alokc83/obsidian-journal-prompter/releases)

2. Extract the contents to your Obsidian plugins folder:
   - Open Obsidian → Settings → Community Plugins
   - Click the folder icon next to "Installed Plugins"
   - Copy the plugin folder to that location

3. Enable the plugin in Settings → Community Plugins
4. Reload Obsidian

## ⚙️ Configuration

### Get API Keys

For **online providers**, you'll need API keys:

- **OpenAI**: Get your key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Google Gemini**: Get your key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Grok (xAI)**: Get your key from [console.x.ai](https://console.x.ai/)
- **Claude**: Get your key from [console.anthropic.com](https://console.anthropic.com/)

For **local providers**, no API keys needed:

- **Ollama**: Install from [ollama.ai](https://ollama.ai/), then run `ollama serve`
- **LM Studio**: Install from [lmstudio.ai](https://lmstudio.ai/), load a model, and start the local server

### Setup Steps

1. Open **Settings** → **Journal Prompter**
2. Select your **AI Provider** from the dropdown
3. Enter your **API Key** (or **URL** for local providers)
4. Wait for models to auto-load (or click "Refresh Models")
5. Select a **model** from the dropdown
6. (Optional) Check **"Show all models"** to see all available models instead of just the latest 2

## 📖 Usage

### Generate a Writing Prompt

**Method 1: Ribbon Icon**
- Click the **step-forward** icon in the left ribbon

**Method 2: Command Palette**
- Press `Ctrl/Cmd + P`
- Type "Generate Prompt For Writing"
- Press Enter

The generated prompt will appear at your cursor position.

## 🎯 Use Cases

- **Journaling**: Turn daily experiences into thought-provoking writing prompts
- **Creative Writing**: Generate prompts for short stories, poems, or scenes
- **Self-Reflection**: Transform thoughts into deeper exploration questions
- **Writing Practice**: Get inspired with fresh, challenging prompts daily

## 🔧 Settings

### Provider Settings

- **AI Provider**: Choose from 6 supported providers
- **API Key / URL**: Provider-specific authentication
- **Model Selection**: Choose from available models with pricing info
- **Show All Models**: Toggle to view all models or just the latest 2

### Prompt Settings

- **System Prompt**: Customize the AI's instruction for generating prompts (default is optimized for journaling)

## 💡 Tips

- **For Testing**: Use cheaper models like `gpt-4o-mini`, `gemini-1.5-flash`, or `claude-3-5-haiku`
- **For Quality**: Use premium models like `gpt-4o`, `gemini-1.5-pro`, or `claude-3-5-sonnet`
- **For Privacy**: Use local providers (Ollama or LM Studio) to keep data offline
- **Model Pricing**: Models with lower total cost (input + output) are highlighted in green

## 🐛 Troubleshooting

### Models Not Loading
- Verify your API key is correct
- Check your internet connection (for online providers)
- Click "Refresh Models" button
- Check browser console (Ctrl+Shift+I) for errors

### Local Providers Not Working
- **Ollama**: Ensure `ollama serve` is running and test with `curl http://localhost:11434/api/tags`
- **LM Studio**: Make sure a model is loaded and the local server is started

### Generation Fails
- Ensure a model is selected
- Check that API key hasn't expired
- Verify provider status (some services may be down)
- Check browser console for detailed error messages

## 📚 Development

### Building from Source

```bash
# Install dependencies
npm install

# Build plugin
npm run build

# Watch mode for development
npm run dev
```

### Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions.

## 🤝 Support

Support the development of this plugin:
- **Ko-fi**: [ko-fi.com/alokc](https://ko-fi.com/alokc)
- **Issues**: Report bugs or request features on [GitHub](https://github.com/alokc83/obsidian-journal-prompter/issues)

## 📄 License

MIT License

---

**Happy writing!** ✍️
