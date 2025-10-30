import { App, ButtonComponent, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, TextAreaComponent } from 'obsidian';
import OpenAI from 'openai';
import { getFlattenedPricing } from './model-pricing';

// Provider types
type AIProvider = 'openai' | 'gemini' | 'grok' | 'claude' | 'ollama' | 'lmstudio';

interface ModelInfo {
	id: string;
	created: number;
}

interface ModelPricing {
	input: number; // Cost per 1M input tokens
	output: number; // Cost per 1M output tokens
}

// Provider abstraction interface
interface AIProviderInterface {
	getName(): string;
	requiresApiKey(): boolean;
	getApiKeyPlaceholder(): string;
	fetchModels(apiKey: string): Promise<ModelInfo[] | null>;
	generateStream(systemPrompt: string, userMessage: string, model: string, apiKey: string): AsyncGenerator<string, void, unknown>;
	getPricing(modelId: string): ModelPricing | null;
}

// Pricing data loaded from model-pricing.ts (easy to update - no hardcoding!)
// Prices are per 1M tokens
const MODEL_PRICING: Record<string, ModelPricing> = getFlattenedPricing();

// Get pricing for a model (with fallback logic)
function getModelPricing(modelId: string): ModelPricing | null {
	// Try exact match first
	if (MODEL_PRICING[modelId]) {
		return MODEL_PRICING[modelId];
	}
	
	// For OpenAI models, try to match base name by removing version suffixes
	if (modelId.startsWith('gpt-')) {
		// Remove date suffix patterns: -2024-08-06, -2024-08-06-preview, etc.
		const baseId = modelId.replace(/-\d{4}-\d{2}-\d{2}(-[a-z]+)*$/i, '');
		if (baseId !== modelId && MODEL_PRICING[baseId]) {
			return MODEL_PRICING[baseId];
		}
		
		// Also try removing numeric suffixes like -0125, -1106
		const baseId2 = baseId.replace(/-\d+$/, '');
		if (baseId2 !== baseId && MODEL_PRICING[baseId2]) {
			return MODEL_PRICING[baseId2];
		}
		
		// Try removing common suffixes like -preview, -instruct
		const baseId3 = modelId.replace(/(-preview|-instruct|-\d{4}-\d{2}-\d{2}.*)$/i, '');
		if (baseId3 !== modelId && MODEL_PRICING[baseId3]) {
			return MODEL_PRICING[baseId3];
		}
	}
	
	return null;
}

// OpenAI Provider Implementation
class OpenAIProvider implements AIProviderInterface {
	getName(): string {
		return 'OpenAI';
	}

	requiresApiKey(): boolean {
		return true;
	}

	getApiKeyPlaceholder(): string {
		return 'Enter your OpenAI API key';
	}

	async fetchModels(apiKey: string): Promise<ModelInfo[] | null> {
		if (!apiKey || apiKey.length === 0) {
			return null;
		}

		try {
			const openai = new OpenAI({
				apiKey: apiKey,
				dangerouslyAllowBrowser: true
			});

			const response = await openai.models.list();
			
			// Filter to only chat-completion compatible models (gpt-*)
			const chatModels: ModelInfo[] = response.data
				.filter(model => model.id.startsWith('gpt-') && 
					(model.id.includes('turbo') || model.id.includes('4') || model.id.includes('3.5')))
				.map(model => ({
					id: model.id,
					created: model.created
				}))
				.sort((a, b) => b.created - a.created);

			return chatModels;
		} catch (error) {
			console.error('Error fetching OpenAI models:', error);
			new Notice('Failed to fetch models from OpenAI API.');
			return null;
		}
	}

	async *generateStream(systemPrompt: string, userMessage: string, model: string, apiKey: string): AsyncGenerator<string, void, unknown> {
		const openai = new OpenAI({
			apiKey: apiKey,
			dangerouslyAllowBrowser: true
		});

		const chatStream = await openai.chat.completions.create({
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userMessage }
			],
			model: model,
			stream: true
		});

		for await (const chunk of chatStream) {
			const data = chunk.choices[0]?.delta?.content || '';
			yield data;
		}
	}

	getPricing(modelId: string): ModelPricing | null {
		return getModelPricing(modelId);
	}
}

// Gemini Provider Implementation
class GeminiProvider implements AIProviderInterface {
	getName(): string {
		return 'Google Gemini';
	}

	requiresApiKey(): boolean {
		return true;
	}

	getApiKeyPlaceholder(): string {
		return 'Enter your Google AI Studio API key';
	}

	async fetchModels(apiKey: string): Promise<ModelInfo[] | null> {
		if (!apiKey || apiKey.length === 0) {
			return null;
		}

		try {
			// Gemini models list - common models
			const models: ModelInfo[] = [
				{ id: 'gemini-2.0-flash-exp', created: Date.now() },
				{ id: 'gemini-1.5-pro', created: Date.now() - 86400000 },
				{ id: 'gemini-1.5-flash', created: Date.now() - 172800000 },
				{ id: 'gemini-pro', created: Date.now() - 259200000 },
			];

			return models.sort((a, b) => b.created - a.created);
		} catch (error) {
			console.error('Error fetching Gemini models:', error);
			new Notice('Failed to fetch models from Gemini API.');
			return null;
		}
	}

	async *generateStream(systemPrompt: string, userMessage: string, model: string, apiKey: string): AsyncGenerator<string, void, unknown> {
		const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				contents: [{
					parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
				}],
				generationConfig: {
					temperature: 0.7,
				}
			})
		});

		if (!response.ok) {
			throw new Error(`Gemini API error: ${response.statusText}`);
		}

		const reader = response.body?.getReader();
		if (!reader) throw new Error('No response body');

		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					try {
						const data = JSON.parse(line.slice(6));
						const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
						if (text) yield text;
					} catch (e) {
						// Skip invalid JSON
					}
				}
			}
		}
	}

	getPricing(modelId: string): ModelPricing | null {
		return getModelPricing(modelId);
	}
}

// Grok Provider Implementation
class GrokProvider implements AIProviderInterface {
	getName(): string {
		return 'Grok (xAI)';
	}

	requiresApiKey(): boolean {
		return true;
	}

	getApiKeyPlaceholder(): string {
		return 'Enter your xAI API key';
	}

	async fetchModels(apiKey: string): Promise<ModelInfo[] | null> {
		if (!apiKey || apiKey.length === 0) {
			return null;
		}

		try {
			// Grok models - xAI API models
			const models: ModelInfo[] = [
				{ id: 'grok-2-1212', created: Date.now() },
				{ id: 'grok-2-vision-1212', created: Date.now() - 86400000 },
				{ id: 'grok-beta', created: Date.now() - 172800000 },
			];

			return models.sort((a, b) => b.created - a.created);
		} catch (error) {
			console.error('Error fetching Grok models:', error);
			new Notice('Failed to fetch models from Grok API.');
			return null;
		}
	}

	async *generateStream(systemPrompt: string, userMessage: string, model: string, apiKey: string): AsyncGenerator<string, void, unknown> {
		const response = await fetch('https://api.x.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userMessage }
				],
				stream: true
			})
		});

		if (!response.ok) {
			throw new Error(`Grok API error: ${response.statusText}`);
		}

		const reader = response.body?.getReader();
		if (!reader) throw new Error('No response body');

		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
					try {
						const data = JSON.parse(line.slice(6));
						const text = data?.choices?.[0]?.delta?.content || '';
						if (text) yield text;
					} catch (e) {
						// Skip invalid JSON
					}
				}
			}
		}
	}

	getPricing(modelId: string): ModelPricing | null {
		return getModelPricing(modelId);
	}
}

// Claude Provider Implementation
class ClaudeProvider implements AIProviderInterface {
	getName(): string {
		return 'Claude (Anthropic)';
	}

	requiresApiKey(): boolean {
		return true;
	}

	getApiKeyPlaceholder(): string {
		return 'Enter your Anthropic API key';
	}

	async fetchModels(apiKey: string): Promise<ModelInfo[] | null> {
		if (!apiKey || apiKey.length === 0) {
			return null;
		}

		try {
			// Claude models - Anthropic API models
			const models: ModelInfo[] = [
				{ id: 'claude-3-5-sonnet-20241022', created: Date.now() },
				{ id: 'claude-3-5-haiku-20241022', created: Date.now() - 86400000 },
				{ id: 'claude-3-opus-20240229', created: Date.now() - 172800000 },
				{ id: 'claude-3-sonnet-20240229', created: Date.now() - 259200000 },
				{ id: 'claude-3-haiku-20240307', created: Date.now() - 345600000 },
			];

			return models.sort((a, b) => b.created - a.created);
		} catch (error) {
			console.error('Error fetching Claude models:', error);
			new Notice('Failed to fetch models from Claude API.');
			return null;
		}
	}

	async *generateStream(systemPrompt: string, userMessage: string, model: string, apiKey: string): AsyncGenerator<string, void, unknown> {
		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model: model,
				max_tokens: 4096,
				system: systemPrompt,
				messages: [
					{ role: 'user', content: userMessage }
				],
				stream: true
			})
		});

		if (!response.ok) {
			throw new Error(`Claude API error: ${response.statusText}`);
		}

		const reader = response.body?.getReader();
		if (!reader) throw new Error('No response body');

		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
					try {
						const data = JSON.parse(line.slice(6));
						if (data.type === 'content_block_delta') {
							const text = data?.delta?.text || '';
							if (text) yield text;
						}
					} catch (e) {
						// Skip invalid JSON
					}
				}
			}
		}
	}

	getPricing(modelId: string): ModelPricing | null {
		return getModelPricing(modelId);
	}
}

// Ollama Provider Implementation
class OllamaProvider implements AIProviderInterface {
	getName(): string {
		return 'Ollama';
	}

	requiresApiKey(): boolean {
		return false; // Local provider, uses URL instead
	}

	getApiKeyPlaceholder(): string {
		return 'http://localhost:11434';
	}

	async fetchModels(url: string): Promise<ModelInfo[] | null> {
		if (!url || url.length === 0) {
			return null;
		}

		try {
			// Ensure URL doesn't end with /
			const baseUrl = url.replace(/\/$/, '');
			const response = await fetch(`${baseUrl}/api/tags`);

			if (!response.ok) {
				throw new Error(`Ollama API error: ${response.statusText}`);
			}

			const data = await response.json();
			const models: ModelInfo[] = (data.models || []).map((model: any) => ({
				id: model.name,
				created: new Date(model.modified_at || Date.now()).getTime()
			})).sort((a: ModelInfo, b: ModelInfo) => b.created - a.created);

			return models;
		} catch (error) {
			console.error('Error fetching Ollama models:', error);
			new Notice('Failed to fetch models from Ollama. Make sure Ollama is running.');
			return null;
		}
	}

	async *generateStream(systemPrompt: string, userMessage: string, model: string, url: string): AsyncGenerator<string, void, unknown> {
		// Ensure URL doesn't end with /
		const baseUrl = url.replace(/\/$/, '');
		
		const response = await fetch(`${baseUrl}/api/chat`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userMessage }
				],
				stream: true
			})
		});

		if (!response.ok) {
			throw new Error(`Ollama API error: ${response.statusText}`);
		}

		const reader = response.body?.getReader();
		if (!reader) throw new Error('No response body');

		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.trim()) {
					try {
						const data = JSON.parse(line);
						const text = data?.message?.content || '';
						if (text) yield text;
						if (data.done) break;
					} catch (e) {
						// Skip invalid JSON
					}
				}
			}
		}
	}

	getPricing(modelId: string): ModelPricing | null {
		// Local models don't have pricing
		return null;
	}
}

// LM Studio Provider Implementation
class LMStudioProvider implements AIProviderInterface {
	getName(): string {
		return 'LM Studio';
	}

	requiresApiKey(): boolean {
		return false; // Local provider, uses URL instead
	}

	getApiKeyPlaceholder(): string {
		return 'http://localhost:1234';
	}

	async fetchModels(url: string): Promise<ModelInfo[] | null> {
		if (!url || url.length === 0) {
			return null;
		}

		try {
			// Ensure URL doesn't end with /
			const baseUrl = url.replace(/\/$/, '');
			const response = await fetch(`${baseUrl}/v1/models`);

			if (!response.ok) {
				throw new Error(`LM Studio API error: ${response.statusText}`);
			}

			const data = await response.json();
			const models: ModelInfo[] = (data.data || []).map((model: any) => ({
				id: model.id,
				created: model.created || Date.now()
			})).sort((a: ModelInfo, b: ModelInfo) => b.created - a.created);

			return models;
		} catch (error) {
			console.error('Error fetching LM Studio models:', error);
			new Notice('Failed to fetch models from LM Studio. Make sure LM Studio is running with server enabled.');
			return null;
		}
	}

	async *generateStream(systemPrompt: string, userMessage: string, model: string, url: string): AsyncGenerator<string, void, unknown> {
		// Ensure URL doesn't end with /
		const baseUrl = url.replace(/\/$/, '');
		
		const response = await fetch(`${baseUrl}/v1/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userMessage }
				],
				stream: true,
				temperature: 0.7
			})
		});

		if (!response.ok) {
			throw new Error(`LM Studio API error: ${response.statusText}`);
		}

		const reader = response.body?.getReader();
		if (!reader) throw new Error('No response body');

		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
					try {
						const data = JSON.parse(line.slice(6));
						const text = data?.choices?.[0]?.delta?.content || '';
						if (text) yield text;
					} catch (e) {
						// Skip invalid JSON
					}
				}
			}
		}
	}

	getPricing(modelId: string): ModelPricing | null {
		// Local models don't have pricing
		return null;
	}
}

// Provider Registry - Factory to get provider instances
function getProvider(providerType: AIProvider): AIProviderInterface | null {
	switch (providerType) {
		case 'openai':
			return new OpenAIProvider();
		case 'gemini':
			return new GeminiProvider();
		case 'grok':
			return new GrokProvider();
		case 'claude':
			return new ClaudeProvider();
		case 'ollama':
			return new OllamaProvider();
		case 'lmstudio':
			return new LMStudioProvider();
		default:
			return null;
	}
}

interface ReversePrompterSettings {
	provider: AIProvider; // Selected AI provider
	apiKeys: {
		openai?: string;
		gemini?: string;
		grok?: string;
		claude?: string;
		ollama?: string; // URL for Ollama (e.g., http://localhost:11434)
		lmstudio?: string; // URL for LM Studio (e.g., http://localhost:1234)
	};
	prompt: string;
	model: string; // User's selected model (only stored when user saves/selects)
	showAllModels: boolean; // Whether to show all models or just latest 2
}

const DEFAULT_PROMPT = "You are an expert prompt generator specializing in short writing exercises, particularly 5-minute journaling sessions. Your primary role is to craft compelling, thought-provoking prompts that inspire users to write with depth and creativity. \n\n" +
"Your prompts should be designed to invoke profound thoughtfulness, deep emotional introspection, challenging philosophical questioning, complex moral ambiguity, and unexpected perspectives. Create prompts that feature unique settings, surprising character flaws, hidden motives, intriguing contradictions, or paradoxical situations that push writers far beyond their comfort zones and encourage them to explore unexpected depths in any subject matter. \n\n" +
"Feel free to blend wildly different genres, juxtapose contrasting time periods, merge conflicting worldviews, introduce open-ended mysteries, or pose philosophical questions that challenge conventional thinking. Your prompts should be catalysts for creative exploration and personal growth through writing. \n\n" +
"CRITICAL: You must always and always provide exactly one single, well-crafted prompt. Do not provide multiple options, explanations, or variations. Give one powerful, focused prompt that will ignite the writer's imagination and drive them to create something meaningful. "

const DEFAULT_SETTINGS: ReversePrompterSettings = {
	provider: 'openai',
	apiKeys: {
		openai: '',
		gemini: '',
		grok: '',
		claude: '',
		ollama: 'http://localhost:11434',
		lmstudio: 'http://localhost:1234'
	},
	prompt: DEFAULT_PROMPT,
	model: '', // No default model - will be set when user selects one
	showAllModels: false // Default to showing only latest 2 models
}

export default class ReversePrompter extends Plugin {
	settings: ReversePrompterSettings;

	inProgress = false;
	private fetchingModels = false;
	cachedModels: ModelInfo[] | null = null; // In-memory cache for current session (public for settings tab access)
	cacheTimestamp: number = 0; // In-memory cache timestamp (public for settings tab access)
	
	// Get the active provider instance
	getActiveProvider(): AIProviderInterface | null {
		return getProvider(this.settings.provider);
	}

	// Get API key for the active provider
	getActiveApiKey(): string {
		return this.settings.apiKeys[this.settings.provider] || '';
	}

	// Clear model cache
	clearModelCache(): void {
		this.cachedModels = null;
		this.cacheTimestamp = 0;
	}

	// Get formatted model name with pricing for display
	getModelDisplayName(modelId: string): string {
		const provider = this.getActiveProvider();
		if (!provider) return modelId;
		
		const pricing = provider.getPricing(modelId);
		if (pricing) {
			return `${modelId} - $${pricing.input.toFixed(2)}/$${pricing.output.toFixed(2)} per 1M tokens`;
		}
		return modelId;
	}

	// Check if a model is cheaper (has lower total cost)
	isCheaperModel(modelId: string): boolean {
		const provider = this.getActiveProvider();
		if (!provider) return false;
		
		const pricing = provider.getPricing(modelId);
		if (!pricing) return false;
		const totalCost = pricing.input + pricing.output;
		
		// Consider models cheaper if total cost is less than $2 per 1M tokens
		return totalCost < 2.0;
	}

	// Get latest models (2 newest by creation date)
	getLatestModels(models: ModelInfo[]): string[] {
		if (models.length === 0) return [];
		
		// Sort by creation date (newest first) and take top 2
		const sorted = [...models].sort((a, b) => b.created - a.created);
		return sorted.slice(0, 2).map(m => m.id);
	}

	// Get all available models from cache
	getAllAvailableModels(): string[] {
		if (!this.cachedModels || this.cachedModels.length === 0) {
			return [];
		}
		return this.cachedModels.map(m => m.id);
	}

	// Get models to display (latest 2 or all, based on setting)
	getAvailableModels(): string[] {
		if (!this.cachedModels || this.cachedModels.length === 0) {
			return [];
		}
		
		if (!this.settings.showAllModels) {
			// Get latest 2 models dynamically
			return this.getLatestModels(this.cachedModels);
		}
		
		return this.getAllAvailableModels();
	}

	// Fetch models from OpenAI API
	async fetchModels(): Promise<ModelInfo[] | null> {
		if (this.fetchingModels) {
			return null; // Already fetching
		}

		const provider = this.getActiveProvider();
		if (!provider) {
			return null;
		}

		const apiKey = this.getActiveApiKey();
		if (!apiKey || apiKey.length === 0) {
			return null; // No API key
		}

		// Check in-memory cache (refresh if older than 1 hour)
		const cacheAge = Date.now() - this.cacheTimestamp;
		if (cacheAge < 3600000 && this.cachedModels) { // 1 hour cache
			return this.cachedModels;
		}

		this.fetchingModels = true;

		try {
			const models = await provider.fetchModels(apiKey);
			
			if (models) {
				// Update in-memory cache (not stored in settings)
				this.cachedModels = models;
				this.cacheTimestamp = Date.now();
			}

			this.fetchingModels = false;
			return models;
		} catch (error) {
			this.fetchingModels = false;
			console.error('Error fetching models:', error);
			const providerName = provider ? provider.getName() : 'selected provider';
			new Notice(`Failed to fetch models from ${providerName} API.`);
			return null;
		}
	}

	async *requestReversePrompt() {
		if (this.inProgress){
			new Notice('Another request is in progress');
			return;
		}

		const provider = this.getActiveProvider();
		if (!provider) {
			new Notice('Provider not implemented yet.');
			return;
		}

		const apiKey = this.getActiveApiKey();
		if (!apiKey || apiKey.length === 0){
			new Notice(`${provider.getName()} API Key is not set`);
			return;
		}

		if (!this.settings.model || this.settings.model.length === 0){
			new Notice('No model selected');
			return;
		}

		this.inProgress = true;
		new Notice(`Generating writing prompt with ${provider.getName()}...`);

		try {
			const stream = provider.generateStream(
				this.settings.prompt,
				"Generate a creative writing prompt for me.",
				this.settings.model,
				apiKey
			);

			for await (const chunk of stream) {
				yield chunk;
			}
		} catch (error) {
			console.error('Error generating prompt:', error);
			new Notice(`Failed to generate prompt with ${provider.getName()}.`);
		} finally {
			this.inProgress = false;
		}
	}

	async generateReversePrompt(view: MarkdownView, editor: Editor){
		const iterator = await this.requestReversePrompt();
		if (!iterator) return;

		const currentLine = editor.getCursor().line;
		const currentLineContent = editor.getLine(currentLine);

		// Ensure we are on an empty line
		if (currentLineContent != ""){
			// Shift to the end of the line and add a new line
			editor.setCursor(currentLine, currentLineContent.length);
			editor.replaceSelection('\n');
		}

		// Stream the response directly at cursor position
		for await (const chunk of iterator){
			editor.replaceSelection(chunk);
		}
		
		// Add a newline at the end for clean formatting
		editor.replaceSelection('\n');
	}

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('step-forward', 'Generate Prompt For Writing', async (evt: MouseEvent) => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				await this.generateReversePrompt(view, view.editor);
			}
		});

		this.addCommand({
			id: 'reverse-prompt',
			name: 'Generate Prompt For Writing',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				await this.generateReversePrompt(view, editor);
			}
		});

		this.addSettingTab(new ReversePrompterSettingsTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		const loadedData = await this.loadData();
		
		// Migration: Convert old settings format to new provider-based format
		if (loadedData && 'openAIApiKey' in loadedData && !loadedData.provider) {
			// Old format detected - migrate to new format
			loadedData.provider = 'openai';
			loadedData.apiKeys = {
				openai: loadedData.openAIApiKey || '',
				gemini: '',
				grok: '',
				claude: '',
				ollama: 'http://localhost:11434',
				lmstudio: 'http://localhost:1234'
			};
			delete loadedData.openAIApiKey;
		}
		
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
		
		// Ensure apiKeys object exists with all fields
		if (!this.settings.apiKeys) {
			this.settings.apiKeys = DEFAULT_SETTINGS.apiKeys;
		}
		
		// Ensure provider is set
		if (!this.settings.provider) {
			this.settings.provider = 'openai';
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

type SettingsMap = {
	[key: string]: Setting;
}

class ReversePrompterSettingsTab extends PluginSettingTab {
	plugin: ReversePrompter;
	settings: SettingsMap = {};
	private apiKeyDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	private modelDropdown: HTMLSelectElement | null = null;

	constructor(app: App, plugin: ReversePrompter) {
		super(app, plugin);
		this.plugin = plugin;
		this.containerEl.id = 'reverse-prompter-settings';
	}

	// Update dropdown options with available models
	async updateModelDropdown() {
		if (!this.modelDropdown) return;

		const currentValue = this.modelDropdown.value;
		
		// Clear existing options
		while (this.modelDropdown.firstChild) {
			this.modelDropdown.removeChild(this.modelDropdown.firstChild);
		}

		const models = this.plugin.getAvailableModels();
		
		for (const model of models) {
			const option = document.createElement('option');
			option.text = this.plugin.getModelDisplayName(model);
			option.value = model;
			
			// Add data attribute for cheaper models for styling
			if (this.plugin.isCheaperModel(model)) {
				option.setAttribute('data-cheaper', 'true');
			}
			
			this.modelDropdown.appendChild(option);
		}

		// Restore selection if it still exists, otherwise select first model
		if (models.includes(currentValue)) {
			this.modelDropdown.value = currentValue;
		} else if (models.length > 0) {
			this.modelDropdown.value = models[0];
			this.plugin.settings.model = models[0];
			await this.plugin.saveSettings();
		}
	}

	// Debounced API key change handler
	private onApiKeyChange(value: string) {
		// Clear existing timer
		if (this.apiKeyDebounceTimer) {
			clearTimeout(this.apiKeyDebounceTimer);
		}

		// Set new timer (debounce 1 second)
		this.apiKeyDebounceTimer = setTimeout(async () => {
			if (value.length > 0) {
				new Notice('Fetching available models...');
				const models = await this.plugin.fetchModels();
				if (models && models.length > 0) {
					await this.updateModelDropdown();
					new Notice(`Loaded ${models.length} models`);
				}
			} else {
				// Clear in-memory cache when API key is removed
				this.plugin.clearModelCache();
				await this.updateModelDropdown();
			}
		}, 1000);
	}

	configureResetButton(button: ButtonComponent, settingKey: string, completeCallback: () => void){
		button.setButtonText("Reset")
		button.onClick(async () => {
			// @ts-ignore Could fix this or move on with life.
			const defaultSettingValue = DEFAULT_SETTINGS[settingKey];

			// Update text input, does not trigger onChange
			const input: TextAreaComponent[] = this.settings[settingKey].components.filter(c => 'inputEl' in c) as TextAreaComponent[]
			if (input.length > 0){
				input[0].setValue(defaultSettingValue);
			}

			// @ts-ignore Could fix this or move on with life.
			this.plugin.settings[settingKey] = defaultSettingValue;

			await this.plugin.saveSettings();

			completeCallback();
		})
	}

	addSetting(key: string): Setting {
		const setting = new Setting(this.containerEl)
		this.settings[key] = setting;
		return setting;
	}

	display(): void {
		this.containerEl.empty();

		const provider = this.plugin.getActiveProvider();
		const apiKey = this.plugin.getActiveApiKey();

		// Provider selector - top of settings
		this.addSetting('provider')
			.setName('AI Provider')
			.setDesc('Select the AI provider to use for generating prompts')
			.addDropdown(dropdown => {
				dropdown.addOption('openai', 'OpenAI');
				dropdown.addOption('gemini', 'Google Gemini');
				dropdown.addOption('grok', 'Grok (xAI)');
				dropdown.addOption('claude', 'Claude (Anthropic)');
				dropdown.addOption('ollama', 'Ollama (Local)');
				dropdown.addOption('lmstudio', 'LM Studio (Local)');
				
				dropdown.setValue(this.plugin.settings.provider);
				dropdown.onChange(async (value) => {
					this.plugin.settings.provider = value as AIProvider;
					await this.plugin.saveSettings();
					// Clear cache when switching providers
					this.plugin.clearModelCache();
					// Redraw settings to show provider-specific fields
					this.display();
				});
			});

		// Provider-specific API key/URL input
		const providerName = provider ? provider.getName() : 'selected provider';
		const needsApiKey = provider ? provider.requiresApiKey() : true;
		const isLocalProvider = this.plugin.settings.provider === 'ollama' || this.plugin.settings.provider === 'lmstudio';
		
		if (needsApiKey || isLocalProvider) {
			const settingKey = isLocalProvider ? 'url' : 'apiKey';
			const label = isLocalProvider ? `${providerName} URL` : `${providerName} API key`;
			const placeholder = isLocalProvider 
				? (this.plugin.settings.provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234')
				: (provider ? provider.getApiKeyPlaceholder() : 'Enter API key');
			const desc = isLocalProvider 
				? `Enter the ${providerName} server URL. Default: ${placeholder}`
				: `Enter your ${providerName} API key. Models will be automatically fetched when a valid key is provided.`;

			this.addSetting(`${this.plugin.settings.provider}ApiKey`)
				.setName(label)
				.setDesc(desc)
				.addText(text => text
					.setPlaceholder(placeholder)
					.setValue(apiKey)
					.onChange(async (value) => {
						if (!this.plugin.settings.apiKeys) {
							this.plugin.settings.apiKeys = {};
						}
						this.plugin.settings.apiKeys[this.plugin.settings.provider] = value;
						await this.plugin.saveSettings();
						this.onApiKeyChange(value);
					}));
		}

		// Try to fetch models if API key exists (in background)
		if (apiKey && apiKey.length > 0) {
			this.plugin.fetchModels().then(() => {
				// Update dropdown after fetch completes
				this.updateModelDropdown();
			}).catch(() => {
				// Silently handle errors, they're already shown in fetchModels
			});
		}
		
		const modelSetting = this.addSetting('model')
			.setName('Model')
			.setDesc(`${providerName} model to use for reverse prompt generation. Shows latest 2 models by default. Pricing shown per 1M tokens when available.`)
			.addDropdown(dropdown => {
				// Store reference to dropdown
				this.modelDropdown = dropdown.selectEl;
				
				// Populate with available models
				const models = this.plugin.getAvailableModels();
				for (const model of models) {
					const displayName = this.plugin.getModelDisplayName(model);
					dropdown.addOption(model, displayName);
				}
				
				// Set current value
				if (this.plugin.settings.model && models.includes(this.plugin.settings.model)) {
					dropdown.setValue(this.plugin.settings.model);
				} else if (models.length > 0) {
					dropdown.setValue(models[0]);
					this.plugin.settings.model = models[0];
					this.plugin.saveSettings();
				}
				
				dropdown.onChange(async (value) => {
					this.plugin.settings.model = value;
					await this.plugin.saveSettings();
				});
			})
			.addButton(button => {
				button.setButtonText('Refresh Models')
					.setTooltip(`Fetch latest models from ${providerName}`)
					.onClick(async () => {
						const currentApiKey = this.plugin.getActiveApiKey();
						if (!currentApiKey || currentApiKey.length === 0) {
							new Notice('Please enter an API key first');
							return;
						}
						
						button.setDisabled(true);
						new Notice('Fetching models...');
						
						// Force refresh by clearing in-memory cache
						this.plugin.cacheTimestamp = 0;
						const models = await this.plugin.fetchModels();
						
						if (models && models.length > 0) {
							await this.updateModelDropdown();
							new Notice(`Loaded ${models.length} models`);
						}
						
						button.setDisabled(false);
					});
			});

		this.addSetting('showAllModels')
			.setName('Show all models')
			.setDesc('When unchecked, only the latest 2 models are shown. Check to display all available models from the selected provider.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showAllModels)
				.onChange(async (value) => {
					this.plugin.settings.showAllModels = value;
					await this.plugin.saveSettings();
					// Update dropdown when toggle changes
					await this.updateModelDropdown();
				}));

		this.addSetting('prompt')
			.setName("Prompt")
			.setDesc("System prompt for generating writing prompts")
			.addTextArea(textArea => {
				textArea.inputEl.id = "reverse-prompter-prompt";
				textArea.setPlaceholder("Enter the prompt")
				textArea.setValue(this.plugin.settings.prompt)
				textArea.onChange(async (value) => {
					this.plugin.settings.prompt = value;
					await this.plugin.saveSettings();
				})
				textArea.inputEl.rows = 10;
			})
			.addButton(button => {
				this.configureResetButton(button, 'prompt', () => {
					new Notice("Prompt reset to default");
				});
			});
		
	}
}
