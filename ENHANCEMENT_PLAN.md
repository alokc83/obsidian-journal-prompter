# Prompt Duration Enhancement Plan

## User Requirements Analysis

### Problem Identified
The current prompts generated are **too dense/complex** for quick writing sessions. Some prompts take 3-4 minutes just to think about before even starting to write, which defeats the purpose of quick journaling.

### Solution: Duration-Based Prompt Generation

## 1. Quick Actions (Fast Access)
**Multiple ribbon icons or commands for quick selection:**

- **5-Minute Prompt** - Simple, straightforward prompts
  - Light prompts that can be understood in <30 seconds
  - Focus on single concepts, simple scenarios
  - Not dense or complex
  
- **10-Minute Prompt** - Slightly more involved
  - A bit more depth than 5-minute, but still accessible
  - Can explore a concept more deeply
  
- **15-Minute Prompt** - Medium complexity
  - More nuanced scenarios
  - Still manageable within time limit
  
- **30-Minute Prompt** - Longer format
  - More detailed scenarios
  - More complex concepts

**Implementation:**
- **Ribbon Icon**: Add icon with "5" for 5-minute quick access
- **Commands**: All durations available as commands:
  - "Generate 5-Min Prompt"
  - "Generate 10-Min Prompt"
  - "Generate 15-Min Prompt"
  - "Generate 30-Min Prompt"
- Modify system prompt based on duration to adjust complexity/density
- Shorter = simpler language, single focus
- Longer = can be more complex, multi-faceted

## 2. Extended Writing Sessions (30+ minutes)
**For longer writing sessions with multi-part narrative:**

**UI Flow:**
1. User triggers "Extended Writing Session" action
2. Modal/dialog appears asking:
   - Duration (30 min, 45 min, 60 min, or custom)
   - Genre/theme preference (optional)
3. System generates **multi-part narrative prompts**
   - Parts are sequential and build on each other
   - Follow a single narrative/story arc
   - Each part advances the story/scenario
   - **Each part designed for ~10 minutes of writing**
   
**Part Calculation:**
- 30 minutes = 3 parts
- 45 minutes = 4-5 parts
- 60 minutes = 6 parts
- Custom duration = (duration / 10) parts (rounded)

**Output Format:**
```
# Extended Writing Session - 45 minutes

## Part 1: [Introduction/Setup]
[First prompt - sets the scene, designed for ~10 min writing]

---

## Part 2: [Development]
[Second prompt - builds on Part 1, ~10 min writing]

---

## Part 3: [Deepening]
[Third prompt - advances the narrative, ~10 min writing]

---

## Part 4: [Climax/Resolution]
[Fourth prompt - concludes or advances further, ~10 min writing]
```

**Characteristics:**
- Prompts are related and sequential
- Build a coherent narrative
- User can follow along progressively
- Each part can be written separately but connects
- **MVP: Independent from theme pool** (no interlinking with single prompts)

## 3. Prompt History & Theme Interlinking (MVP)

### MVP Scope: Single Prompts Only

**What Gets Tracked:**
- All **single prompts** (5, 10, 15, 30 min) → Use theme pool
- All **extended session prompts** → Stored but NOT used for theme pool
- Storage: Hidden plugin data (not in vault)

**How It Works:**

1. **Single Prompt Generation:**
   ```
   When generating single prompt #21:
   
   1. Load ALL previous SINGLE prompts (#1-20)
   2. Extract themes/topics from them
   3. Build context: "Previous themes: [identity, time, mirrors, ...]"
   4. Generate new prompt that:
      - Relates to these themes
      - Explores them from fresh angle
      - Not repetitive
   5. Save prompt to history
   
   Result: User's notes naturally interlink through shared themes
   ```

2. **Extended Session Generation:**
   ```
   When generating extended session:
   
   1. Generate completely independent narrative
   2. No theme pool influence
   3. Save all parts to history (for future reference only)
   
   Result: Extended sessions are self-contained narratives
   ```

**Storage Structure (Hidden in Plugin Data):**
```typescript
interface PromptHistory {
  singlePrompts: Array<{
    id: string;
    text: string;
    generatedAt: number;
    duration: number;  // 5, 10, 15, or 30
    model: string;
    provider: string;
    extractedThemes: string[];
    keywords: string[];
  }>;
  
  extendedSessions: Array<{
    sessionId: string;
    duration: number;
    parts: Array<{
      partNumber: number;
      text: string;
      generatedAt: number;
    }>;
    generatedAt: number;
  }>;
  
  themeFrequency: {
    [theme: string]: number;
  };
}
```

**Benefits:**
- Single prompts create organic connections through shared themes
- Extended sessions remain flexible and unconstrained
- All prompts stored (extended for future hybrid approach)
- Clean separation: MVP focus on single prompt interlinking

### Future Enhancement (Post-MVP):
- **Hybrid Approach**: Extended sessions can optionally use theme pool
- User choice: "Build on recent themes" vs "Fresh narrative"
- Light theme infusion for extended sessions

## Implementation Plan

### Phase 1: Duration-Based System Prompts
- Add duration parameter to prompt generation
- Modify DEFAULT_PROMPT to include duration guidance
- Create prompt templates for each duration (5, 10, 15, 30 min)
- **Time:** 4-6 hours

### Phase 2: Quick Actions
- Add 4 new commands for quick duration selection (5, 10, 15, 30 min)
- Add ribbon icon with "5" for 5-minute quick access
- Each command calls `generateReversePrompt()` with duration parameter
- System prompt adjusts based on duration
- **Time:** 4-6 hours

**Checkpoint 1 - Commit & Push:**
- After Phase 1 + Phase 2 completion: Commit "feat: duration-based prompts with quick actions"
- Test all duration commands (5, 10, 15, 30 min) and ribbon icon
- Push to remote branch

### Phase 3: Extended Session UI
- Add "Extended Writing Session" command
- Create modal dialog for duration/theme selection
- Implement multi-part prompt generation
- Format output as structured multi-part prompts
- **Time:** 6-8 hours

**Checkpoint 2 - Commit & Push:**
- After Phase 3 completion: Commit "feat: extended writing sessions with multi-part prompts"
- Test extended session modal, part generation, and formatted output
- Push to remote branch

### Phase 4: Prompt History & Theme Interlinking (MVP)
**Scope: Single Prompts Only**

1. **Storage System** (2-3 hours)
   - Create prompt history interface
   - Save single prompts to plugin data
   - Save extended sessions to plugin data (separate)
   - Extract basic keywords/themes from prompts

2. **Theme Extraction** (3-4 hours)
   - Analyze single prompts for themes (keyword-based or simple LLM)
   - Build theme frequency map
   - Keep last 50-100 single prompts

3. **Context Building for Single Prompts** (3-4 hours)
   - Load previous single prompts
   - Extract top themes
   - Build enhanced system prompt with theme context
   - Inject: "Build on themes: [X, Y, Z] but explore fresh angle"

4. **Extended Session Independence** (1 hour)
   - Ensure extended sessions don't use theme pool
   - Generate independently
   - Still save to history (for future)

**Total Phase 4 Time:** 9-12 hours

**Checkpoint 3 - Commit & Push:**
- After Phase 4 completion: Commit "feat: prompt history and theme interlinking for single prompts"
- Test theme extraction, history storage, and theme-infused prompt generation
- Push to remote branch

### Phase 5: Enhanced Prompt Templates
- 5-min: "Simple, single-concept prompts. One clear question or scenario."
- 10-min: "Slightly deeper exploration of a concept."
- 15-min: "Nuanced scenarios with multiple layers."
- 30-min: "Complex scenarios with depth and detail."
- Extended: "Multi-part narrative prompts that build sequentially."
- **Time:** 2-3 hours

**Checkpoint 4 - Final Commit & Push:**
- After Phase 5 completion: Commit "feat: enhanced prompt templates for all durations"
- Complete testing and refinement of all features
- Push to remote branch
- Ready for MVP release

## Key Principles
1. **Shorter = Simpler**: 5-minute prompts must be graspable in <30 seconds
2. **Longer = More Complex**: Can handle deeper, multi-layered prompts
3. **Extended = Narrative**: Sequential prompts that tell a story
4. **User Choice**: User decides how much time they have and gets appropriate prompt
5. **MVP Separation**: Single prompts interlink; Extended sessions independent

## Decisions Made

### 1. Ribbon Icons vs Commands
- **5-minute prompt**: Ribbon icon with "5" symbol for quick access
- **All durations**: Available as commands (5, 10, 15, 30 minutes)
- Users can access 5-min via ribbon or command, others via command palette

### 2. Extended Session Part Calculation
- **Each part = ~10 minutes of writing**
- Part count based on duration:
  - 30 minutes = 3 parts
  - 45 minutes = 4-5 parts  
  - 60 minutes = 6 parts
  - Custom duration = (duration / 10) rounded to nearest integer

### 3. Prompt History & Interlinking (MVP)
- **Single prompts (5, 10, 15, 30 min)**: Use theme pool for interlinking
- **Extended sessions**: Independent, no theme pool
- **Storage**: Hidden in plugin data (not in vault)
- **Future**: Hybrid approach where extended sessions can optionally use themes

### 4. Custom System Prompts per Duration
- **Deferred to future version**
- For now, system prompt adjusts dynamically based on duration parameter
- User can still customize the main system prompt in settings

### 5. Last Selected Duration Preference
- Not implemented in initial version
- Can be added later if needed

## MVP Implementation Timeline

**Week 1: Core Duration Features**
- Phase 1: Duration-based prompts (4-6 hrs)
- Phase 2: Quick actions (4-6 hrs)
- **Subtotal: 8-12 hours**

**Week 2: Extended Sessions**
- Phase 3: Extended session UI (6-8 hrs)
- **Subtotal: 6-8 hours**

**Week 3: Prompt History (MVP)**
- Phase 4: Storage & theme interlinking for single prompts (9-12 hrs)
- **Subtotal: 9-12 hours**

**Week 4: Polish**
- Phase 5: Enhanced templates (2-3 hrs)
- Testing & refinement
- **Subtotal: 4-6 hours**

**Total MVP: ~27-38 hours of development**

## Future Enhancements (Post-MVP)

1. **Hybrid Theme Approach**: Extended sessions can optionally use theme pool
2. **LLM-Powered Theme Analysis**: Deeper semantic theme extraction
3. **User Notifications**: "This note relates to your writing from prompt #X"
4. **Theme Visualization**: Show theme evolution over time
5. **Custom Theme Preferences**: User can highlight preferred themes
