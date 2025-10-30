# Journal Prompter Plugin - Testing Guide

## 📋 Table of Contents
1. [Installation & Setup](#installation--setup)
2. [Basic Configuration](#basic-configuration)
3. [Testing All Providers](#testing-all-providers)
4. [Testing User Scenarios](#testing-user-scenarios)
5. [Testing UI Features](#testing-ui-features)
6. [Error Handling Tests](#error-handling-tests)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Installation & Setup

### Step 1: Build the Plugin
```bash
cd /Users/alokchoudhary/Documents/Code/Github/ObsidianVault/.obsidian/plugins/obsidian-journal-prompter
npm run build
```

### Step 2: Enable Plugin in Obsidian
1. Open Obsidian
2. Go to **Settings** → **Community plugins**
3. Make sure **Safe mode is OFF**
4. Find **"Journal Prompter"** in the installed plugins list
5. Toggle it **ON**

### Step 3: Verify Plugin is Loaded
- You should see a **step-forward** icon in the left ribbon
- Go to **Settings** → **Journal Prompter** - settings page should open

---

## ⚙️ Basic Configuration

### Quick Start with OpenAI (Recommended for First Test)

1. **Open Settings**
   - Click **Settings** → **Journal Prompter**

2. **Configure Provider**
   - Set **AI Provider** to `OpenAI`
   - Enter your **OpenAI API key** in the API key field
   - Wait 1-2 seconds for models to auto-fetch

3. **Select Model**
   - Prioritize cheaper models (green) for testing
   - Default shows latest 2 models
   - Check **"Show all models"** to see all available models

4. **Test Basic Generation**
   - Open a new note in Obsidian
   - Type some text (e.g., "Today I felt overwhelmed at work")
   - Press the **ribbon icon** or use Command Palette: **"Generate writing prompt"**
   - A journal prompt should appear below your text

---

## 🧪 Testing All Providers

### Test 1: OpenAI Provider ✅
**Prerequisites:** OpenAI API key

**Steps:**
1. Settings → Provider: `OpenAI`
2. Enter OpenAI API key
3. Wait for models to load
4. Select a model (e.g., `gpt-4o-mini` - cheapest for testing)
5. Create a note with text: "I'm learning about machine learning"
6. Click ribbon icon
7. **Expected:** Journal prompt generated using OpenAI

**Verify:**
- ✅ Models appear with pricing (e.g., `gpt-4o-mini - $0.15/$0.60 per 1M tokens`)
- ✅ Cheaper models shown in green (if styled)
- ✅ Prompt appears in newline below cursor
- ✅ No prefix/postfix (clean output)

---

### Test 2: Google Gemini Provider ✅
**Prerequisites:** Google AI Studio API key

**Steps:**
1. Get API key from: https://aistudio.google.com/app/apikey
2. Settings → Provider: `Google Gemini`
3. Enter Gemini API key
4. Wait for models to load (should show: gemini-2.0-flash-exp, gemini-1.5-pro, etc.)
5. Select a model (e.g., `gemini-2.0-flash-exp`)
6. Create note with text: "I want to write about travel experiences"
7. Click ribbon icon
8. **Expected:** Journal prompt generated using Gemini

**Verify:**
- ✅ Models appear with pricing when available
- ✅ Prompt generates successfully
- ✅ No errors in console

---

### Test 3: Grok (xAI) Provider ✅
**Prerequisites:** xAI API key

**Steps:**
1. Get API key from: https://console.x.ai/
2. Settings → Provider: `Grok (xAI)`
3. Enter xAI API key
4. Wait for models (grok-2-1212, grok-2-vision-1212, grok-beta)
5. Select a model
6. Test generation
7. **Expected:** Journal prompt generated using Grok

---

### Test 4: Claude (Anthropic) Provider ✅
**Prerequisites:** Anthropic API key

**Steps:**
1. Get API key from: https://console.anthropic.com/
2. Settings → Provider: `Claude (Anthropic)`
3. Enter Anthropic API key
4. Wait for models (claude-3-5-sonnet-20241022, etc.)
5. Select a model (e.g., `claude-3-5-haiku-20241022` - cheaper)
6. Test generation
7. **Expected:** Journal prompt generated using Claude

---

### Test 5: Ollama Provider (Local) ✅
**Prerequisites:** 
- Ollama installed: https://ollama.ai/
- At least one model downloaded (e.g., `ollama pull llama3.2`)

**Steps:**
1. Start Ollama server:
   ```bash
   ollama serve
   ```
2. Verify it's running:
   ```bash
   curl http://localhost:11434/api/tags
   ```
3. Settings → Provider: `Ollama (Local)`
4. URL should default to: `http://localhost:11434`
5. Wait for models to load (should show your installed models)
6. Select a model (e.g., `llama3.2`)
7. Test generation
8. **Expected:** Journal prompt generated using local Ollama model

**Verify:**
- ✅ Local models appear (no pricing, as expected)
- ✅ Generation works offline
- ✅ No API key required

---

### Test 6: LM Studio Provider (Local) ✅
**Prerequisites:**
- LM Studio installed: https://lmstudio.ai/
- Model loaded and server running

**Steps:**
1. Open LM Studio
2. Load a model
3. Start local server (button in top right)
4. Settings → Provider: `LM Studio (Local)`
5. URL should default to: `http://localhost:1234`
6. Wait for models to load
7. Select your loaded model
8. Test generation
9. **Expected:** Journal prompt generated using LM Studio model

**Verify:**
- ✅ Models appear from LM Studio
- ✅ Works offline
- ✅ No API key required

---

## 📝 Testing User Scenarios

### Scenario 1: With Text Selection
**Steps:**
1. In a note, type: "I had a difficult conversation with my manager today"
2. **Select** the text (highlight it)
3. Click ribbon icon or use command
4. **Expected:** 
   - Only selected text is sent to AI
   - Prompt appears after the selection
   - Cursor moves to end of selection

### Scenario 2: Without Selection (Uses All Text Above Cursor)
**Steps:**
1. In a note, type several paragraphs:
   ```
   Today was interesting.
   
   I learned about new technologies.
   I also met some interesting people.
   ```
2. Place cursor at the end (don't select anything)
3. Click ribbon icon
4. **Expected:**
   - All text from start to cursor is sent to AI
   - Prompt appears at cursor position

### Scenario 3: Empty Note
**Steps:**
1. Create new note (completely empty)
2. Click ribbon icon
3. **Expected:**
   - Error notice: "Text is too short"
   - No prompt generated

### Scenario 4: Very Short Text
**Steps:**
1. Type: "x" (single character)
2. Click ribbon icon
3. **Expected:**
   - Error notice: "Text is too short"
   - No prompt generated

---

## 🎨 Testing UI Features

### Test: Provider Switching
**Steps:**
1. Configure OpenAI with API key
2. Switch to Gemini
3. **Expected:**
   - API key field updates to Gemini placeholder
   - Model dropdown clears
   - Cache is cleared
4. Enter Gemini API key
5. Wait for models to load
6. Switch back to OpenAI
7. **Expected:**
   - OpenAI API key still present
   - Models reload

### Test: Show All Models Toggle
**Steps:**
1. With a provider configured, uncheck "Show all models"
2. **Expected:** Only latest 2 models in dropdown
3. Check "Show all models"
4. **Expected:** All available models appear

### Test: Refresh Models Button
**Steps:**
1. Configure a provider
2. Models load automatically
3. Click "Refresh Models" button
4. **Expected:**
   - Button becomes disabled during fetch
   - Notice: "Fetching models..."
   - Models reload
   - Notice: "Loaded X models"
   - Button re-enables

### Test: Model Display Format
**Verify:**
- Models show pricing when available: `model-name - $X.XX/$Y.YY per 1M tokens`
- Local models (Ollama/LM Studio) show without pricing
- Cheaper models highlighted in green (if CSS applied)

---

## ⚠️ Error Handling Tests

### Test: Missing API Key
**Steps:**
1. Select a provider that requires API key
2. Leave API key field empty
3. Click ribbon icon
4. **Expected:** Notice: "[Provider] API Key is not set"

### Test: Invalid API Key
**Steps:**
1. Enter obviously invalid key: "invalid-key-123"
2. Wait for models to fetch (should fail)
3. **Expected:** 
   - Notice: "Failed to fetch models from [Provider] API"
   - Model dropdown empty
   - Cannot generate prompts

### Test: No Model Selected
**Steps:**
1. Enter valid API key
2. Don't select a model (dropdown empty or not selected)
3. Click ribbon icon
4. **Expected:** Notice: "No model selected"

### Test: Network Error (Offline)
**Steps:**
1. Disconnect internet
2. Try generating with online provider
3. **Expected:** 
   - Error notice about failed generation
   - Console shows error details

### Test: Local Provider Not Running
**Steps:**
1. Select Ollama provider
2. Stop Ollama server (if running)
3. Click "Refresh Models" or try generation
4. **Expected:**
   - Notice: "Failed to fetch models from Ollama. Make sure Ollama is running."
   - Cannot generate prompts

### Test: Concurrent Requests
**Steps:**
1. Click ribbon icon (starts generation)
2. Immediately click again before first completes
3. **Expected:** Notice: "Another request is in progress"

---

## 🔧 Troubleshooting

### Issue: Plugin not appearing in settings
**Solution:**
- Check that plugin is enabled in Community plugins
- Restart Obsidian
- Verify `main.js` exists in plugin folder

### Issue: Models not loading
**Solution:**
- Verify API key is correct
- Check console for errors (Ctrl+Shift+I)
- Try manual refresh button
- Verify network connection (for online providers)

### Issue: Generation fails silently
**Solution:**
- Open browser console (Ctrl+Shift+I) to see errors
- Check that model is selected
- Verify API key hasn't expired
- Check provider status (website down?)

### Issue: Local providers not working
**Solution:**
- Verify Ollama/LM Studio is running
- Check URL is correct (default ports: 11434 for Ollama, 1234 for LM Studio)
- Test with: `curl http://localhost:11434/api/tags` (Ollama)
- Verify model is loaded in LM Studio before starting server

---

## ✅ Testing Checklist

### Core Functionality
- [ ] Plugin loads in Obsidian
- [ ] Settings page accessible
- [ ] Ribbon icon visible and clickable
- [ ] Command palette command works
- [ ] All 6 providers can be selected
- [ ] API keys/URLs can be saved

### Model Management
- [ ] Models auto-fetch on API key entry
- [ ] Models show pricing (online providers)
- [ ] Latest 2 models shown by default
- [ ] "Show all models" toggle works
- [ ] Refresh button works
- [ ] Model selection persists after reload

### Generation
- [ ] Works with text selection
- [ ] Works without selection (uses all text above)
- [ ] Handles empty/short text errors
- [ ] Prompt appears in correct location
- [ ] No prefix/postfix added
- [ ] Newline added at end

### Error Handling
- [ ] Missing API key error
- [ ] Invalid API key error
- [ ] No model selected error
- [ ] Network errors handled
- [ ] Concurrent request prevention

### Provider-Specific
- [ ] OpenAI works
- [ ] Gemini works
- [ ] Grok works
- [ ] Claude works
- [ ] Ollama works (if installed)
- [ ] LM Studio works (if installed)

---

## 📊 Test Results Template

```
Date: _______________
Tester: _______________

### Provider Tests
- [ ] OpenAI: ⏱️ __s - ✅/❌ - Notes: ________
- [ ] Gemini: ⏱️ __s - ✅/❌ - Notes: ________
- [ ] Grok: ⏱️ __s - ✅/❌ - Notes: ________
- [ ] Claude: ⏱️ __s - ✅/❌ - Notes: ________
- [ ] Ollama: ⏱️ __s - ✅/❌ - Notes: ________
- [ ] LM Studio: ⏱️ __s - ✅/❌ - Notes: ________

### Scenario Tests
- [ ] With selection: ✅/❌
- [ ] Without selection: ✅/❌
- [ ] Empty note: ✅/❌
- [ ] Short text: ✅/❌

### Error Tests
- [ ] Missing API key: ✅/❌
- [ ] Invalid API key: ✅/❌
- [ ] No model: ✅/❌
- [ ] Concurrent requests: ✅/❌

### Issues Found
1. _______________
2. _______________

### Performance Notes
- Fastest provider: ________
- Slowest provider: ________
```

---

Happy Testing! 🎉

