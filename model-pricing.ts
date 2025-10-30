// Model Pricing Data
// This file can be easily updated with latest pricing from provider documentation
// Prices are per 1M tokens

export interface ModelPricing {
	input: number; // Cost per 1M input tokens
	output: number; // Cost per 1M output tokens
}

export interface PricingData {
	[provider: string]: {
		[modelId: string]: ModelPricing;
	};
}

export const MODEL_PRICING_DATA: PricingData = {
	openai: {
		"gpt-4o": { input: 2.50, output: 10.00 },
		"gpt-4o-mini": { input: 0.15, output: 0.60 },
		"gpt-4-turbo": { input: 10.00, output: 30.00 },
		"gpt-4-turbo-preview": { input: 10.00, output: 30.00 },
		"gpt-4": { input: 30.00, output: 60.00 },
		"gpt-4-32k": { input: 60.00, output: 120.00 },
		"gpt-3.5-turbo": { input: 0.50, output: 1.50 }
	},
	gemini: {
		"gemini-2.0-flash-exp": { input: 0.075, output: 0.30 },
		"gemini-1.5-pro": { input: 1.25, output: 5.00 },
		"gemini-1.5-flash": { input: 0.075, output: 0.30 },
		"gemini-pro": { input: 0.50, output: 1.50 }
	},
	grok: {
		"grok-2-1212": { input: 2.00, output: 10.00 },
		"grok-2-vision-1212": { input: 2.00, output: 10.00 },
		"grok-beta": { input: 1.50, output: 8.00 }
	},
	claude: {
		"claude-3-5-sonnet-20241022": { input: 3.00, output: 15.00 },
		"claude-3-5-haiku-20241022": { input: 0.80, output: 4.00 },
		"claude-3-opus-20240229": { input: 15.00, output: 75.00 },
		"claude-3-sonnet-20240229": { input: 3.00, output: 15.00 },
		"claude-3-haiku-20240307": { input: 0.80, output: 4.00 }
	}
};

// Helper to flatten and get all pricing
export function getFlattenedPricing(): Record<string, ModelPricing> {
	const flattened: Record<string, ModelPricing> = {};
	for (const provider in MODEL_PRICING_DATA) {
		for (const modelId in MODEL_PRICING_DATA[provider]) {
			flattened[modelId] = MODEL_PRICING_DATA[provider][modelId];
		}
	}
	return flattened;
}

