# Gemini Interactions API

> **Recommended:** The **Interactions API** is the recommended standard API for all new projects and applications using Gemini. It is optimized for agentic workflows, server-side state management, and real-time conversations.

Note: You are viewing the beta version of the Interactions API. Endpoints are under `/v1beta/`. The stable [v1 version](interactions-api-v1) is also available.

The Gemini Interactions API allows developers to build generative AI applications using Gemini models. Gemini is our most capable model, built from the ground up to be multimodal. It can generalize and seamlessly understand, operate across, and combine different types of information including language, images, audio, video, and code. You can use the Gemini API for use cases like reasoning across text and images, content generation, dialogue agents, summarization and classification systems, and more.

## Interactions

### Creating an interaction

`POST https://generativelanguage.googleapis.com/v1beta/interactions`

Creates a new interaction.

#### Parameters
- **api_version** (`string`) *(Required)* Which version of the API to use.


#### Request Body
- **model** (`ModelOption`) The name of the `Model` used for generating the interaction. <br><strong>Required if `agent` is not provided.</strong>
  Possible values:
  - `gemini-2.5-computer-use-preview-10-2025`: An agentic capability model designed for direct interface interaction, allowing Gemini to perceive and navigate digital environments.
  - `gemini-2.5-flash`: Our first hybrid reasoning model which supports a 1M token context window and has thinking budgets.
  - `gemini-2.5-flash-image`: Our native image generation model, optimized for speed, flexibility, and contextual understanding. Text input and output is priced the same as 2.5 Flash.
  - `gemini-2.5-flash-lite`: Our smallest and most cost effective model, built for at scale usage.
  - `gemini-2.5-flash-lite-preview-09-2025`: The latest model based on Gemini 2.5 Flash lite optimized for cost-efficiency, high throughput and high quality.
  - `gemini-2.5-flash-native-audio-preview-12-2025`: Our native audio models optimized for higher quality audio outputs with better pacing, voice naturalness, verbosity, and mood.
  - `gemini-2.5-flash-preview-09-2025`: The latest model based on the 2.5 Flash model. 2.5 Flash Preview is best for large scale processing, low-latency, high volume tasks that require thinking, and agentic use cases.
  - `gemini-2.5-flash-preview-tts`: Our 2.5 Flash text-to-speech model optimized for powerful, low-latency controllable speech generation.
  - `gemini-2.5-pro`: Our state-of-the-art multipurpose model, which excels at coding and complex reasoning tasks.
  - `gemini-2.5-pro-preview-tts`: Our 2.5 Pro text-to-speech audio model optimized for powerful, low-latency speech generation for more natural outputs and easier to steer prompts.
  - `gemini-3-flash-preview`: Our most intelligent model built for speed, combining frontier intelligence with superior search and grounding.
  - `gemini-3-pro-image-preview`: State-of-the-art image generation and editing model.
  - `gemini-3-pro-preview`: Our most intelligent model with SOTA reasoning and multimodal understanding, and powerful agentic and vibe coding capabilities.
  - `gemini-3.1-pro-preview`: Our latest SOTA reasoning model with unprecedented depth and nuance, and powerful multimodal understanding and coding capabilities.
  - `gemini-3.1-flash-image-preview`: Pro-level visual intelligence with Flash-speed efficiency and reality-grounded generation capabilities.
  - `gemini-3.1-flash-lite`: Our most cost-efficient model, optimized for high-volume agentic tasks, translation, and simple data processing.
  - `gemini-3.1-flash-lite-preview`: Our most cost-efficient model, optimized for high-volume agentic tasks, translation, and simple data processing.
  - `gemini-3.1-flash-tts-preview`: Gemini 3.1 Flash TTS: Powerful, low-latency speech generation. Enjoy natural outputs, steerable prompts, and new expressive audio tags for precise narration control.
  - `gemini-3.5-flash`: Our most intelligent model for sustained frontier performance in agentic and coding tasks.
  - `lyria-3-clip-preview`: Our low-latency, music generation model optimized for high-fidelity audio clips and precise rhythmic control.
  - `lyria-3-pro-preview`: Our advanced, full-song generative model with deep compositional understanding, optimized for precise structural control and complex transitions across diverse musical styles.

- **agent** (`AgentOption`) The name of the `Agent` used for generating the interaction. <br><strong>Required if `model` is not provided.</strong>
  Possible values:
  - `deep-research-pro-preview-12-2025`: Gemini Deep Research Agent
  - `deep-research-preview-04-2026`: Gemini Deep Research Agent
  - `deep-research-max-preview-04-2026`: Gemini Deep Research Max Agent
  - `antigravity-preview-05-2026`: Use the Antigravity managed agent to perform multi-step tasks that require reasoning, file operations, and tool use.

- **input** (`Content or array (Content) or array (Step) or array (Turn) or string`) *(Required)* The inputs for the interaction (common to both Model and Agent).

- **system_instruction** (`string`) System instruction for the interaction.

- **tools** (`array (Tool)`) A list of tool declarations the model may call during interaction.

- **response_format** (`ResponseFormat or array (ResponseFormat)`) Enforces that the generated response is a JSON object that complies with the JSON schema specified in this field.

- **stream** (`boolean`) Input only. Whether the interaction will be streamed.

- **store** (`boolean`) Input only. Whether to store the response and request for later retrieval.

- **background** (`boolean`) Input only. Whether to run the model interaction in the background.

- **generation_config** (`GenerationConfig`) <strong>Model Configuration</strong><br>Configuration parameters for the model interaction. <br><em>Alternative to `agent_config`. Only applicable when `model` is set.</em>
  - **max_output_tokens** (`integer`)   The maximum number of tokens to include in the response.

  - **seed** (`integer`)   Seed used in decoding for reproducibility.

  - **speech_config** (`array (SpeechConfig)`)   Configuration for speech interaction.
    - **language** (`string`)     The language of the speech.

    - **speaker** (`string`)     The speaker's name, it should match the speaker name given in the prompt.

    - **voice** (`string`)     The voice of the speaker.


  - **stop_sequences** (`array (string)`)   A list of character sequences that will stop output interaction.

  - **temperature** (`number`)   Controls the randomness of the output.

  - **thinking_level** (`ThinkingLevel`)   The level of thought tokens that the model should generate.
    Possible values:
    - `minimal`: Little to no thinking.
    - `low`: Low thinking level.
    - `medium`: Medium thinking level.
    - `high`: High thinking level.

  - **thinking_summaries** (`ThinkingSummaries`)   Whether to include thought summaries in the response.
    Possible values:
    - `auto`: Auto thinking summaries.
    - `none`: No thinking summaries.

  - **tool_choice** (`ToolChoiceConfig or enum (string)`)   The tool choice configuration.
    Possible values:
    - `auto`: Auto tool choice.
    - `any`: Any tool choice.
    - `none`: No tool choice.
    - `validated`: Validated tool choice.

  - **top_p** (`number`)   The maximum cumulative probability of tokens to consider when sampling.

  - **video_config** (`VideoConfig`)   Configuration for video generation.
    - **task** (`enum (string)`)     Optional task mode for video generation. If not specified, the model automatically determines the appropriate mode based on the provided text prompt and input media.
      Possible values:
      - `text_to_video`: Generates video solely from a text prompt.
      - `image_to_video`: Generates video from one or two source images. The first image defines
the starting frame, and the optional second image defines the ending
frame.
      - `reference_to_video`: Generates video using reference media (such as images, audio, or video).
      - `edit`: Modifies an existing input video.



- **agent_config** (`DeepResearchAgentConfig or DynamicAgentConfig`) <strong>Agent Configuration</strong><br>Configuration for the agent. <br><em>Alternative to `generation_config`. Only applicable when `agent` is set.</em>
  **Possible Types:** (Discriminator: `type`)
  - **DynamicAgentConfig**: Configuration for dynamic agents.
  - **type** (`object`) *(Required)*
    Value: `dynamic`
  - **DeepResearchAgentConfig**: Configuration for the Deep Research agent.
  - **collaborative_planning** (`boolean`)   Enables human-in-the-loop planning for the Deep Research agent. If set to true, the Deep Research agent will provide a research plan in its response. The agent will then proceed only if the user confirms the plan in the next turn.

  - **enable_bigquery_tool** (`boolean`)   Enables bigquery tool for the Deep Research agent.

  - **thinking_summaries** (`ThinkingSummaries`)   Whether to include thought summaries in the response.
    Possible values:
    - `auto`: Auto thinking summaries.
    - `none`: No thinking summaries.

  - **type** (`object`) *(Required)*
    Value: `deep-research`
  - **visualization** (`enum (string)`)   Whether to include visualizations in the response.
    Possible values:
    - `off`: Do not include visualizations.
    - `auto`: Automatically include visualizations.


- **environment** (`EnvironmentConfig or string`) The environment configuration for the interaction. Can be an object specifying remote environment sources or a string referencing an existing environment ID.

- **labels** (`object`) The labels with user-defined metadata for the request.

- **previous_interaction_id** (`string`) The ID of the previous interaction, if any.

- **response_modalities** (`array (ResponseModality)`) The requested modalities of the response (TEXT, IMAGE, AUDIO).
  Possible values:
  - `text`: Indicates the model should return text.
  - `image`: Indicates the model should return images.
  - `audio`: Indicates the model should return audio.
  - `video`: Indicates the model should return video.
  - `document`: Indicates the model should return documents.

- **safety_settings** (`array (SafetySetting)`) Safety settings for the interaction.
  - **method** (`enum (string)`)   Optional. The method for blocking content. If not specified, the default behavior is to use the probability score.
    Possible values:
    - `severity`: The harm block method uses both probability and severity scores.
    - `probability`: The harm block method uses the probability score.

  - **threshold** (`enum (string)`) *(Required)*   Required. The threshold for blocking content. If the harm probability exceeds this threshold, the content will be blocked.
    Possible values:
    - `block_low_and_above`: Block content with a low harm probability or higher.
    - `block_medium_and_above`: Block content with a medium harm probability or higher.
    - `block_only_high`: Block content with a high harm probability.
    - `block_none`: Do not block any content, regardless of its harm probability.
    - `off`: Turn off the safety filter entirely.

  - **type** (`HarmCategory`) *(Required)*   Required. The type of harm category to be blocked.
    Possible values:
    - `hate_speech`: Content that promotes violence or incites hatred against individuals or
groups based on certain attributes.
    - `dangerous_content`: Content that promotes, facilitates, or enables dangerous activities.
    - `harassment`: Abusive, threatening, or content intended to bully, torment, or ridicule.
    - `sexually_explicit`: Content that contains sexually explicit material.
    - `civic_integrity`: Deprecated: Election filter is not longer supported.
The harm category is civic integrity.
    - `image_hate`: Images that contain hate speech.
    - `image_dangerous_content`: Images that contain dangerous content.
    - `image_harassment`: Images that contain harassment.
    - `image_sexually_explicit`: Images that contain sexually explicit content.
    - `jailbreak`: Prompts designed to bypass safety filters.


- **service_tier** (`ServiceTier`) The service tier for the interaction.
  Possible values:
  - `flex`: Flex service tier.
  - `standard`: Standard service tier.
  - `priority`: Priority service tier.

- **webhook_config** (`WebhookConfig`) Optional. Webhook configuration for receiving notifications when the interaction completes.
  - **uris** (`array (string)`)   Optional. If set, these webhook URIs will be used for webhook events instead of the registered webhooks.

  - **user_metadata** (`object`)   Optional. The user metadata that will be returned on each event emission to the webhooks.



#### Response
Returns [Interaction](#interaction) resources.

#### Examples
**Simple Request**

**REST**

```sh
curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "model": "gemini-3.5-flash",
    "input": "Hello, how are you?"
  }'
```
**Python**

```python
from google import genai

client = genai.Client()
interaction = client.interactions.create(
    model="gemini-3.5-flash",
    input="Hello, how are you?",
)
print(interaction.output_text)
```
**JavaScript**

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    model: 'gemini-3.5-flash',
    input: 'Hello, how are you?',
});
console.log(interaction.output_text);
```
Response:
```json
{
  "created": "2025-11-26T12:25:15Z",
  "id": "v1_ChdPU0F4YWFtNkFwS2kxZThQZ05lbXdROBIXT1NBeGFhbTZBcEtpMWU4UGdOZW13UTg",
  "model": "gemini-3.5-flash",
  "object": "interaction",
  "steps": [
    {
      "type": "model_output",
      "content": [
        {
          "type": "text",
          "text": "Hello! I'm functioning perfectly and ready to assist you.\n\nHow are you doing today?"
        }
      ]
    }
  ],
  "status": "completed",
  "updated": "2025-11-26T12:25:15Z",
  "usage": {
    "input_tokens_by_modality": [
      {
        "modality": "text",
        "tokens": 7
      }
    ],
    "total_cached_tokens": 0,
    "total_input_tokens": 7,
    "total_output_tokens": 20,
    "total_thought_tokens": 22,
    "total_tokens": 49,
    "total_tool_use_tokens": 0
  }
}
```
**Multi-turn**

**REST**

```sh
curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "model": "gemini-3.5-flash",
    "input": [
      { "type": "user_input", "content": [{ "type": "text", "text": "Hello!" }] },
      { "type": "model_output", "content": [{ "type": "text", "text": "Hi there! How can I help you today?" }] },
      { "type": "user_input", "content": [{ "type": "text", "text": "What is the capital of France?" }] }
    ]
  }'
```
**Python**

```python
from google import genai

client = genai.Client()
response = client.interactions.create(
    model="gemini-3.5-flash",
    input=[
        { "type": "user_input", "content": [{ "type": "text", "text": "Hello!" }] },
        { "type": "model_output", "content": [{ "type": "text", "text": "Hi there! How can I help you today?" }] },
        { "type": "user_input", "content": [{ "type": "text", "text": "What is the capital of France?" }] }
    ]
)
print(response.output_text)
```
**JavaScript**

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    model: 'gemini-3.5-flash',
    input: [
        { type: 'user_input', content: [{ type: 'text', text: 'Hello' }] },
        { type: 'model_output', content: [{ type: 'text', text: 'Hi there! How can I help you today?' }] },
        { type: 'user_input', content: [{ type: 'text', text: 'What is the capital of France?' }] }
    ]
});
console.log(interaction.output_text);
```
Response:
```json
{
  "id": "v1_ChdPU0F4YWFtNkFwS2kxZThQZ05lbXdROBIXT1NBeGFhbTZBcEtpMWU4UGdOZW13UTg",
  "model": "gemini-3.5-flash",
  "status": "completed",
  "object": "interaction",
  "created": "2025-11-26T12:22:47Z",
  "updated": "2025-11-26T12:22:47Z",
  "steps": [
    {
      "type": "model_output",
      "content": [
        {
          "type": "text",
          "text": "The capital of France is Paris."
        }
      ]
    }
  ],
  "usage": {
    "input_tokens_by_modality": [
      {
        "modality": "text",
        "tokens": 50
      }
    ],
    "total_cached_tokens": 0,
    "total_input_tokens": 50,
    "total_output_tokens": 10,
    "total_thought_tokens": 0,
    "total_tokens": 60,
    "total_tool_use_tokens": 0
  }
}
```
**Image Input**

**REST**

```sh
curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "model": "gemini-3.5-flash",
    "input": [
      {
        "type": "text",
        "text": "What is in this picture?"
      },
      {
        "type": "image",
        "data": "BASE64_ENCODED_IMAGE",
        "mime_type": "image/png"
      }
    ]
  }'
```
**Python**

```python
from google import genai

client = genai.Client()
response = client.interactions.create(
    model="gemini-3.5-flash",
    input=[
      { "type": "text", "text": "What is in this picture?" },
      { "type": "image", "data": "BASE64_ENCODED_IMAGE", "mime_type": "image/png" }
    ]
)
print(response.output_text)
```
**JavaScript**

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    model: 'gemini-3.5-flash',
    input: [
      { type: 'text', text: 'What is in this picture?' },
      { type: 'image', data: 'BASE64_ENCODED_IMAGE', mime_type: 'image/png' }
    ]
});
console.log(interaction.output_text);
```
Response:
```json
{
  "id": "v1_ChdPU0F4YWFtNkFwS2kxZThQZ05lbXdROBIXT1NBeGFhbTZBcEtpMWU4UGdOZW13UTg",
  "model": "gemini-3.5-flash",
  "status": "completed",
  "object": "interaction",
  "created": "2025-11-26T12:22:47Z",
  "updated": "2025-11-26T12:22:47Z",
  "steps": [
    {
      "type": "model_output",
      "content": [
        {
          "type": "text",
          "text": "A white humanoid robot with glowing blue eyes stands holding a red skateboard."
        }
      ]
    }
  ],
  "usage": {
    "input_tokens_by_modality": [
      {
        "modality": "text",
        "tokens": 10
      },
      {
        "modality": "image",
        "tokens": 258
      }
    ],
    "total_cached_tokens": 0,
    "total_input_tokens": 268,
    "total_output_tokens": 20,
    "total_thought_tokens": 0,
    "total_tokens": 288,
    "total_tool_use_tokens": 0
  }
}
```
**Function Calling**

**REST**

```sh
curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "model": "gemini-3.5-flash",
    "tools": [
      {
        "type": "function",
        "name": "get_weather",
        "description": "Get the current weather in a given location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state, e.g. San Francisco, CA"
            }
          },
          "required": [
            "location"
          ]
        }
      }
    ],
    "input": "What is the weather like in Boston, MA?"
  }'
```
**Python**

```python
from google import genai

client = genai.Client()
response = client.interactions.create(
    model="gemini-3.5-flash",
    tools=[{
        "type": "function",
        "name": "get_weather",
        "description": "Get the current weather in a given location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and state, e.g. San Francisco, CA"
                }
            },
            "required": ["location"]
        }
    }],
    input="What is the weather like in Boston, MA?"
)
print(response.steps[-1])
```
**JavaScript**

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    model: 'gemini-3.5-flash',
    tools: [{
        type: 'function',
        name: 'get_weather',
        description: 'Get the current weather in a given location',
        parameters: {
            type: 'object',
            properties: {
                location: {
                    type: 'string',
                    description: 'The city and state, e.g. San Francisco, CA'
                }
            },
            required: ['location']
        }
    }],
    input: 'What is the weather like in Boston, MA?'
});
console.log(interaction.steps.at(-1));
```
Response:
```json
{
  "id": "v1_ChdPU0F4YWFtNkFwS2kxZThQZ05lbXdROBIXT1NBeGFhbTZBcEtpMWU4UGdOZW13UTg",
  "model": "gemini-3.5-flash",
  "status": "requires_action",
  "object": "interaction",
  "created": "2025-11-26T12:22:47Z",
  "updated": "2025-11-26T12:22:47Z",
  "steps": [
    {
      "type": "function_call",
      "id": "gth23981",
      "name": "get_weather",
      "arguments": {
        "location": "Boston, MA"
      }
    }
  ],
  "usage": {
    "input_tokens_by_modality": [
      {
        "modality": "text",
        "tokens": 100
      }
    ],
    "total_cached_tokens": 0,
    "total_input_tokens": 100,
    "total_output_tokens": 25,
    "total_thought_tokens": 0,
    "total_tokens": 125,
    "total_tool_use_tokens": 50
  }
}
```
**Deep Research**

**REST**

```sh
curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "agent": "deep-research-pro-preview-12-2025",
    "input": "Find a cure to cancer",
    "background": true
  }'
```
**Python**

```python
from google import genai

client = genai.Client()
interaction = client.interactions.create(
    agent="deep-research-pro-preview-12-2025",
    input="find a cure to cancer",
    background=True,
)
print(interaction.status)
```
**JavaScript**

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    agent: 'deep-research-pro-preview-12-2025',
    input: 'find a cure to cancer',
    background: true,
});
console.log(interaction.status);
```
Response:
```json
{
  "id": "v1_ChdPU0F4YWFtNkFwS2kxZThQZ05lbXdROBIXT1NBeGFhbTZBcEtpMWU4UGdOZW13UTg",
  "agent": "deep-research-pro-preview-12-2025",
  "status": "completed",
  "object": "interaction",
  "created": "2025-11-26T12:22:47Z",
  "updated": "2025-11-26T12:22:47Z",
  "steps": [
    {
      "type": "model_output",
      "content": [
        {
          "type": "text",
          "text": "Here is a comprehensive research report on the current state of cancer research..."
        }
      ]
    }
  ],
  "usage": {
    "input_tokens_by_modality": [
      {
        "modality": "text",
        "tokens": 20
      }
    ],
    "total_cached_tokens": 0,
    "total_input_tokens": 20,
    "total_output_tokens": 1000,
    "total_thought_tokens": 500,
    "total_tokens": 1520,
    "total_tool_use_tokens": 0
  }
}
```
**Antigravity Agent**

**REST**

```sh
curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "agent": "antigravity-preview-05-2026",
    "input": "Read Hacker News, summarize the top 5 stories, and save results as a markdown file.",
    "environment": "remote"
  }'
```
**Python**

```python
from google import genai

client = genai.Client()
interaction = client.interactions.create(
    agent="antigravity-preview-05-2026",
    input="Read Hacker News, summarize the top 5 stories, and save results as a markdown file.",
    environment="remote",
)
print(interaction.output_text)
```
**JavaScript**

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    agent: 'antigravity-preview-05-2026',
    input: 'Read Hacker News, summarize the top 5 stories, and save results as a markdown file.',
    environment: 'remote',
});
console.log(interaction.output_text);
```
Response:
```json
{
  "id": "v1_ChdPU0F4YWFtNkFwS2kxZThQZ05lbXdROBIXT1NBeGFhbTZBcEtpMWU4UGdOZW13UTg",
  "agent": "antigravity-preview-05-2026",
  "status": "completed",
  "environment_id": "env_abc123",
  "object": "interaction",
  "created": "2025-11-26T12:22:47Z",
  "updated": "2025-11-26T12:22:47Z",
  "steps": [
    {
      "type": "model_output",
      "content": [
        {
          "type": "text",
          "text": "I've summarized the top 5 Hacker News stories and saved the results to /workspace/summary.md."
        }
      ]
    }
  ],
  "usage": {
    "input_tokens_by_modality": [
      {
        "modality": "text",
        "tokens": 50
      }
    ],
    "total_cached_tokens": 0,
    "total_input_tokens": 50,
    "total_output_tokens": 500,
    "total_thought_tokens": 200,
    "total_tokens": 750,
    "total_tool_use_tokens": 0
  }
}
```
**Reuse Environment**

**REST**

```sh
# Step 1: Create an interaction with a fresh remote environment.
RESPONSE=$(curl -s -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "agent": "antigravity-preview-05-2026",
    "input": "Write a hello world script at /workspace/hello.py.",
    "environment": "remote"
  }')
INTERACTION_ID=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
ENV_ID=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['environment_id'])")

# Step 2: Reuse the same environment in a follow-up interaction.
curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d "{
    \"agent\": \"antigravity-preview-05-2026\",
    \"input\": \"Modify the script to accept a name argument and greet the user.\",
    \"environment\": \"$ENV_ID\",
    \"previous_interaction_id\": \"$INTERACTION_ID\"
  }"
```
**Python**

```python
from google import genai

client = genai.Client()

# Step 1: Create an interaction with a fresh remote environment.
interaction = client.interactions.create(
    agent="antigravity-preview-05-2026",
    input="Write a hello world script at /workspace/hello.py.",
    environment="remote",
)
print(f"Environment ID: {interaction.environment_id}")

# Step 2: Reuse the same environment in a follow-up interaction.
interaction_2 = client.interactions.create(
    agent="antigravity-preview-05-2026",
    input="Modify the script to accept a name argument and greet the user.",
    environment=interaction.environment_id,
    previous_interaction_id=interaction.id,
)
print(interaction_2.output_text)
```
**JavaScript**

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});

// Step 1: Create an interaction with a fresh remote environment.
const interaction = await ai.interactions.create({
    agent: 'antigravity-preview-05-2026',
    input: 'Write a hello world script at /workspace/hello.py.',
    environment: 'remote',
});
console.log(`Environment ID: ${interaction.environment_id}`);

// Step 2: Reuse the same environment in a follow-up interaction.
const interaction2 = await ai.interactions.create({
    agent: 'antigravity-preview-05-2026',
    input: 'Modify the script to accept a name argument and greet the user.',
    environment: interaction.environment_id,
    previous_interaction_id: interaction.id,
});
console.log(interaction2.output_text);
```
Response:
```json
{
  "id": "v1_Chd2ZTJhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkwMTIzNDU2Nzg",
  "agent": "antigravity-preview-05-2026",
  "status": "completed",
  "environment_id": "env_abc123",
  "object": "interaction",
  "created": "2025-11-26T12:23:00Z",
  "updated": "2025-11-26T12:23:00Z",
  "steps": [
    {
      "type": "model_output",
      "content": [
        {
          "type": "text",
          "text": "I've updated /workspace/hello.py to accept a name argument and greet the user."
        }
      ]
    }
  ],
  "usage": {
    "input_tokens_by_modality": [
      {
        "modality": "text",
        "tokens": 80
      }
    ],
    "total_cached_tokens": 0,
    "total_input_tokens": 80,
    "total_output_tokens": 200,
    "total_thought_tokens": 100,
    "total_tokens": 380,
    "total_tool_use_tokens": 0
  }
}
```
**With Sources**

**REST**

```sh
curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "agent": "antigravity-preview-05-2026",
    "input": "List all files under /workspace and summarize what you find.",
    "environment": {
      "type": "remote",
      "sources": [
        {
          "type": "repository",
          "source": "https://github.com/octocat/Spoon-Knife",
          "target": "/workspace/repo"
        },
        {
          "type": "inline",
          "content": "Focus on Python files only.",
          "target": "/workspace/notes.txt"
        }
      ]
    }
  }'
```
**Python**

```python
from google import genai

client = genai.Client()
interaction = client.interactions.create(
    agent="antigravity-preview-05-2026",
    input="List all files under /workspace and summarize what you find.",
    environment={
        "type": "remote",
        "sources": [
            {
                "type": "repository",
                "source": "https://github.com/octocat/Spoon-Knife",
                "target": "/workspace/repo",
            },
            {
                "type": "inline",
                "content": "Focus on Python files only.",
                "target": "/workspace/notes.txt",
            },
        ],
    },
)
print(interaction.output_text)
```
**JavaScript**

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    agent: 'antigravity-preview-05-2026',
    input: 'List all files under /workspace and summarize what you find.',
    environment: {
        type: 'remote',
        sources: [
            {
                type: 'repository',
                source: 'https://github.com/octocat/Spoon-Knife',
                target: '/workspace/repo',
            },
            {
                type: 'inline',
                content: 'Focus on Python files only.',
                target: '/workspace/notes.txt',
            },
        ],
    },
});
console.log(interaction.output_text);
```
**Custom Agent**

**REST**

```sh
# Step 1: Create a custom agent.
curl -X POST https://generativelanguage.googleapis.com/v1beta/agents \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "id": "code-reviewer",
    "base_agent": "antigravity-preview-05-2026",
    "system_instruction": "You are a senior code reviewer. Check every file for bugs, style issues, and security vulnerabilities.",
    "base_environment": {
      "type": "remote",
      "sources": [{
        "type": "repository",
        "source": "https://github.com/octocat/Spoon-Knife",
        "target": "/workspace/repo"
      }]
    }
  }'

# Step 2: Use the custom agent.
curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "agent": "code-reviewer",
    "input": "Review the latest changes in /workspace/repo/src and file a summary.",
    "environment": "remote"
  }'
```
**Python**

```python
import uuid
from google import genai

client = genai.Client()

# Step 1: Create a custom agent.
agent_id = f"code-reviewer-{uuid.uuid4().hex[:8]}"
client.agents.create(
    id=agent_id,
    base_agent="antigravity-preview-05-2026",
    system_instruction="You are a senior code reviewer. Check every file for bugs, style issues, and security vulnerabilities.",
    base_environment={
        "type": "remote",
        "sources": [{
            "type": "repository",
            "source": "https://github.com/octocat/Spoon-Knife",
            "target": "/workspace/repo",
        }],
    },
)

# Step 2: Use the custom agent.
result = client.interactions.create(
    agent=agent_id,
    input="Review the latest changes in /workspace/repo/src and file a summary.",
    environment="remote",
)
print(result.output_text)

```
**JavaScript**

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});

// Step 1: Create a custom agent.
const agentId = `code-reviewer-${crypto.randomUUID().slice(0, 8)}`;
await ai.agents.create({
    id: agentId,
    base_agent: 'antigravity-preview-05-2026',
    system_instruction: 'You are a senior code reviewer. Check every file for bugs, style issues, and security vulnerabilities.',
    base_environment: {
        type: 'remote',
        sources: [{
            type: 'repository',
            source: 'https://github.com/octocat/Spoon-Knife',
            target: '/workspace/repo',
        }],
    },
});

// Step 2: Use the custom agent.
const result = await ai.interactions.create({
    agent: agentId,
    input: 'Review the latest changes in /workspace/repo/src and file a summary.',
    environment: 'remote',
});
console.log(result.output_text);

```
---
### Canceling an interaction

`POST https://generativelanguage.googleapis.com/v1beta/interactions/{id}/cancel`

Cancels an interaction by id. This only applies to background interactions that are still running.

#### Parameters
- **api_version** (`string`) *(Required)* Which version of the API to use.

- **id** (`string`) *(Required)* The unique identifier of the interaction to cancel.



#### Response
Returns [Interaction](#interaction) resources.

#### Examples
**Cancel Interaction**

**REST**

```sh

curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions/$INTERACTION_ID/cancel" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Api-Revision: 2026-05-20"
```
**Python**

```python
from google import genai

client = genai.Client()

# Start a background interaction so it stays in-progress.
created = client.interactions.create(
    model="gemini-3.5-flash",
    input="Write a long essay about the history of computing.",
    tools=[{"type": "computer_use"}],
    background=True,
)

# Cancel the in-progress interaction.
interaction = client.interactions.cancel(id=created.id)
print(interaction.status)
```
**JavaScript**

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});

// Start a background interaction so it stays in-progress.
const created = await ai.interactions.create({
    model: 'gemini-3.5-flash',
    input: 'Write a long essay about the history of computing.',
    tools: [{ type: 'computer_use' }],
    background: true,
});

// Cancel the in-progress interaction.
const interaction = await ai.interactions.cancel(created.id);
console.log(interaction.status);
```
Response:
```json
{
  "id": "v1_ChdVc0E0YXJTYk1zYlV6N0lQcXRXVG1BYxIXVXNBNGFyU2JNc2JVejdJUHF0V1RtQWM",
  "agent": "deep-research-pro-preview-12-2025",
  "status": "cancelled",
  "created": "2026-06-22T04:55:47Z",
  "updated": "2026-06-22T04:55:47Z",
  "steps": [
    {
      "type": "user_input",
      "content": [
        {
          "type": "text",
          "text": "Research the history of the Google TPUs with a focus on 2025 specs."
        }
      ]
    }
  ]
}
```
---
### Retrieving an interaction

`GET https://generativelanguage.googleapis.com/v1beta/interactions/{id}`

Retrieves the full details of a single interaction based on its `Interaction.id`.

#### Parameters
- **api_version** (`string`) *(Required)* Which version of the API to use.

- **id** (`string`) *(Required)* The unique identifier of the interaction to retrieve.

- **last_event_id** (`string`) Optional. If set, resumes the interaction stream from the next chunk after the event marked by the event id. Can only be used if `stream` is true.

- **stream** (`boolean`) If set to true, the generated content will be streamed incrementally.
  Default: `False`


#### Response
Returns [Interaction](#interaction) resources.

#### Examples
**Get Interaction**

**REST**

```sh

curl -X GET "https://generativelanguage.googleapis.com/v1beta/interactions/$INTERACTION_ID" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Api-Revision: 2026-05-20"
```
**Python**

```python
from google import genai

client = genai.Client()


interaction = client.interactions.get(id=created.id)
print(interaction.status)
```
**JavaScript**

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});


const interaction = await ai.interactions.get(created.id);
console.log(interaction.status);
```
Response:
```json
{
  "id": "v1_ChdPU0F4YWFtNkFwS2kxZThQZ05lbXdROBIXT1NBeGFhbTZBcEtpMWU4UGdOZW13UTg",
  "model": "gemini-3.5-flash",
  "status": "completed",
  "object": "interaction",
  "created": "2025-11-26T12:25:15Z",
  "updated": "2025-11-26T12:25:15Z",
  "steps": [
    {
      "type": "model_output",
      "content": [
        {
          "type": "text",
          "text": "I'm doing great, thank you for asking! How can I help you today?"
        }
      ]
    }
  ]
}
```
---
### Deleting an interaction

`DELETE https://generativelanguage.googleapis.com/v1beta/interactions/{id}`

Deletes the interaction by id.

#### Parameters
- **api_version** (`string`) *(Required)* Which version of the API to use.

- **id** (`string`) *(Required)* The unique identifier of the interaction to delete.



#### Response
Empty response.

#### Examples
**Delete**

**REST**

```sh

curl -X DELETE "https://generativelanguage.googleapis.com/v1beta/interactions/$INTERACTION_ID" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Api-Revision: 2026-05-20"
```
**Python**

```python
from google import genai

client = genai.Client()


client.interactions.delete(id=created.id)
print("Interaction deleted successfully.")
```
**JavaScript**

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});


await ai.interactions.delete(created.id);
console.log('Interaction deleted successfully.');
```
---

## Resources
### Interaction { #Resource:Interaction }
The Interaction resource.

**Properties:**
- **agent** (`AgentOption`) The name of the `Agent` used for generating the interaction.
  Possible values:
  - `deep-research-pro-preview-12-2025`: Gemini Deep Research Agent
  - `deep-research-preview-04-2026`: Gemini Deep Research Agent
  - `deep-research-max-preview-04-2026`: Gemini Deep Research Max Agent
  - `antigravity-preview-05-2026`: Use the Antigravity managed agent to perform multi-step tasks that require reasoning, file operations, and tool use.

- **agent_config** (`DeepResearchAgentConfig or DynamicAgentConfig`) Configuration parameters for the agent interaction.
  **Possible Types:** (Discriminator: `type`)
  - **DynamicAgentConfig**: Configuration for dynamic agents.
  - **type** (`object`) *(Required)*
    Value: `dynamic`
  - **DeepResearchAgentConfig**: Configuration for the Deep Research agent.
  - **collaborative_planning** (`boolean`)   Enables human-in-the-loop planning for the Deep Research agent. If set to true, the Deep Research agent will provide a research plan in its response. The agent will then proceed only if the user confirms the plan in the next turn.

  - **enable_bigquery_tool** (`boolean`)   Enables bigquery tool for the Deep Research agent.

  - **thinking_summaries** (`ThinkingSummaries`)   Whether to include thought summaries in the response.
    Possible values:
    - `auto`: Auto thinking summaries.
    - `none`: No thinking summaries.

  - **type** (`object`) *(Required)*
    Value: `deep-research`
  - **visualization** (`enum (string)`)   Whether to include visualizations in the response.
    Possible values:
    - `off`: Do not include visualizations.
    - `auto`: Automatically include visualizations.


- **created** (`string`) Output only. The time at which the response was created in ISO 8601 format (YYYY-MM-DDThh:mm:ssZ).

- **environment** (`EnvironmentConfig or string`) The environment configuration for the interaction. Can be an object specifying remote environment sources or a string referencing an existing environment ID.

- **environment_id** (`string`) Output only. The environment ID for the interaction. Only populated if environment config is set in the request.

- **generation_config** (`GenerationConfig`) Input only. Configuration parameters for the model interaction.
  - **max_output_tokens** (`integer`)   The maximum number of tokens to include in the response.

  - **seed** (`integer`)   Seed used in decoding for reproducibility.

  - **speech_config** (`array (SpeechConfig)`)   Configuration for speech interaction.
    - **language** (`string`)     The language of the speech.

    - **speaker** (`string`)     The speaker's name, it should match the speaker name given in the prompt.

    - **voice** (`string`)     The voice of the speaker.


  - **stop_sequences** (`array (string)`)   A list of character sequences that will stop output interaction.

  - **temperature** (`number`)   Controls the randomness of the output.

  - **thinking_level** (`ThinkingLevel`)   The level of thought tokens that the model should generate.
    Possible values:
    - `minimal`: Little to no thinking.
    - `low`: Low thinking level.
    - `medium`: Medium thinking level.
    - `high`: High thinking level.

  - **thinking_summaries** (`ThinkingSummaries`)   Whether to include thought summaries in the response.
    Possible values:
    - `auto`: Auto thinking summaries.
    - `none`: No thinking summaries.

  - **tool_choice** (`ToolChoiceConfig or enum (string)`)   The tool choice configuration.
    Possible values:
    - `auto`: Auto tool choice.
    - `any`: Any tool choice.
    - `none`: No tool choice.
    - `validated`: Validated tool choice.

  - **top_p** (`number`)   The maximum cumulative probability of tokens to consider when sampling.

  - **video_config** (`VideoConfig`)   Configuration for video generation.
    - **task** (`enum (string)`)     Optional task mode for video generation. If not specified, the model automatically determines the appropriate mode based on the provided text prompt and input media.
      Possible values:
      - `text_to_video`: Generates video solely from a text prompt.
      - `image_to_video`: Generates video from one or two source images. The first image defines
the starting frame, and the optional second image defines the ending
frame.
      - `reference_to_video`: Generates video using reference media (such as images, audio, or video).
      - `edit`: Modifies an existing input video.



- **id** (`string`) Required. Output only. A unique identifier for the interaction completion.
  Default: ``
- **input** (`Content or array (Content) or array (Step) or array (Turn) or string`) The input for the interaction.

- **labels** (`object`) The labels with user-defined metadata for the request.

- **model** (`ModelOption`) The name of the `Model` used for generating the interaction.
  Possible values:
  - `gemini-2.5-computer-use-preview-10-2025`: An agentic capability model designed for direct interface interaction, allowing Gemini to perceive and navigate digital environments.
  - `gemini-2.5-flash`: Our first hybrid reasoning model which supports a 1M token context window and has thinking budgets.
  - `gemini-2.5-flash-image`: Our native image generation model, optimized for speed, flexibility, and contextual understanding. Text input and output is priced the same as 2.5 Flash.
  - `gemini-2.5-flash-lite`: Our smallest and most cost effective model, built for at scale usage.
  - `gemini-2.5-flash-lite-preview-09-2025`: The latest model based on Gemini 2.5 Flash lite optimized for cost-efficiency, high throughput and high quality.
  - `gemini-2.5-flash-native-audio-preview-12-2025`: Our native audio models optimized for higher quality audio outputs with better pacing, voice naturalness, verbosity, and mood.
  - `gemini-2.5-flash-preview-09-2025`: The latest model based on the 2.5 Flash model. 2.5 Flash Preview is best for large scale processing, low-latency, high volume tasks that require thinking, and agentic use cases.
  - `gemini-2.5-flash-preview-tts`: Our 2.5 Flash text-to-speech model optimized for powerful, low-latency controllable speech generation.
  - `gemini-2.5-pro`: Our state-of-the-art multipurpose model, which excels at coding and complex reasoning tasks.
  - `gemini-2.5-pro-preview-tts`: Our 2.5 Pro text-to-speech audio model optimized for powerful, low-latency speech generation for more natural outputs and easier to steer prompts.
  - `gemini-3-flash-preview`: Our most intelligent model built for speed, combining frontier intelligence with superior search and grounding.
  - `gemini-3-pro-image-preview`: State-of-the-art image generation and editing model.
  - `gemini-3-pro-preview`: Our most intelligent model with SOTA reasoning and multimodal understanding, and powerful agentic and vibe coding capabilities.
  - `gemini-3.1-pro-preview`: Our latest SOTA reasoning model with unprecedented depth and nuance, and powerful multimodal understanding and coding capabilities.
  - `gemini-3.1-flash-image-preview`: Pro-level visual intelligence with Flash-speed efficiency and reality-grounded generation capabilities.
  - `gemini-3.1-flash-lite`: Our most cost-efficient model, optimized for high-volume agentic tasks, translation, and simple data processing.
  - `gemini-3.1-flash-lite-preview`: Our most cost-efficient model, optimized for high-volume agentic tasks, translation, and simple data processing.
  - `gemini-3.1-flash-tts-preview`: Gemini 3.1 Flash TTS: Powerful, low-latency speech generation. Enjoy natural outputs, steerable prompts, and new expressive audio tags for precise narration control.
  - `gemini-3.5-flash`: Our most intelligent model for sustained frontier performance in agentic and coding tasks.
  - `lyria-3-clip-preview`: Our low-latency, music generation model optimized for high-fidelity audio clips and precise rhythmic control.
  - `lyria-3-pro-preview`: Our advanced, full-song generative model with deep compositional understanding, optimized for precise structural control and complex transitions across diverse musical styles.

- **output_audio** (`AudioContent`) The last audio generated by the model in response to the current request.  Note: this is added by the SDK.
  - **channels** (`integer`)   The number of audio channels.

  - **data** (`string`)   The audio content.

  - **mime_type** (`enum (string)`)   The mime type of the audio.
    Possible values:
    - `audio/wav`: WAV audio format
    - `audio/mp3`: MP3 audio format
    - `audio/aiff`: AIFF audio format
    - `audio/aac`: AAC audio format
    - `audio/ogg`: OGG audio format
    - `audio/flac`: FLAC audio format
    - `audio/mpeg`: MPEG audio format
    - `audio/m4a`: M4A audio format
    - `audio/l16`: L16 audio format
    - `audio/opus`: OPUS audio format
    - `audio/alaw`: ALAW audio format
    - `audio/mulaw`: MULAW audio format

  - **sample_rate** (`integer`)   The sample rate of the audio.

  - **type** (`object`) *(Required)*
    Value: `audio`
  - **uri** (`string`)   The URI of the audio.


- **output_image** (`ImageContent`) The last image generated by the model in response to the current request.  Note: this is added by the SDK.

- **output_text** (`string`) Concatenated text from the last model output in response to the current request.  Note: this is added by the SDK.

- **output_video** (`VideoContent`) The last video generated by the model in response to the current request.  Note: this is added by the SDK.
  - **data** (`string`)   The video content.

  - **mime_type** (`enum (string)`)   The mime type of the video.
    Possible values:
    - `video/mp4`: MP4 video format
    - `video/mpeg`: MPEG video format
    - `video/mpg`: MPG video format
    - `video/mov`: MOV video format
    - `video/avi`: AVI video format
    - `video/x-flv`: FLV video format
    - `video/webm`: WebM video format
    - `video/wmv`: WMV video format
    - `video/3gpp`: 3GPP video format

  - **resolution** (`MediaResolution`)   The resolution of the media.
    Possible values:
    - `low`: Low resolution.
    - `medium`: Medium resolution.
    - `high`: High resolution.
    - `ultra_high`: Ultra high resolution.

  - **type** (`object`) *(Required)*
    Value: `video`
  - **uri** (`string`)   The URI of the video.


- **previous_interaction_id** (`string`) The ID of the previous interaction, if any.

- **response_format** (`ResponseFormat or array (ResponseFormat)`) Enforces that the generated response is a JSON object that complies with the JSON schema specified in this field.

- **response_modalities** (`array (ResponseModality)`) The requested modalities of the response (TEXT, IMAGE, AUDIO).
  Possible values:
  - `text`: Indicates the model should return text.
  - `image`: Indicates the model should return images.
  - `audio`: Indicates the model should return audio.
  - `video`: Indicates the model should return video.
  - `document`: Indicates the model should return documents.

- **safety_settings** (`array (SafetySetting)`) Safety settings for the interaction.
  - **method** (`enum (string)`)   Optional. The method for blocking content. If not specified, the default behavior is to use the probability score.
    Possible values:
    - `severity`: The harm block method uses both probability and severity scores.
    - `probability`: The harm block method uses the probability score.

  - **threshold** (`enum (string)`) *(Required)*   Required. The threshold for blocking content. If the harm probability exceeds this threshold, the content will be blocked.
    Possible values:
    - `block_low_and_above`: Block content with a low harm probability or higher.
    - `block_medium_and_above`: Block content with a medium harm probability or higher.
    - `block_only_high`: Block content with a high harm probability.
    - `block_none`: Do not block any content, regardless of its harm probability.
    - `off`: Turn off the safety filter entirely.

  - **type** (`HarmCategory`) *(Required)*   Required. The type of harm category to be blocked.
    Possible values:
    - `hate_speech`: Content that promotes violence or incites hatred against individuals or
groups based on certain attributes.
    - `dangerous_content`: Content that promotes, facilitates, or enables dangerous activities.
    - `harassment`: Abusive, threatening, or content intended to bully, torment, or ridicule.
    - `sexually_explicit`: Content that contains sexually explicit material.
    - `civic_integrity`: Deprecated: Election filter is not longer supported.
The harm category is civic integrity.
    - `image_hate`: Images that contain hate speech.
    - `image_dangerous_content`: Images that contain dangerous content.
    - `image_harassment`: Images that contain harassment.
    - `image_sexually_explicit`: Images that contain sexually explicit content.
    - `jailbreak`: Prompts designed to bypass safety filters.


- **service_tier** (`ServiceTier`) The service tier for the interaction.
  Possible values:
  - `flex`: Flex service tier.
  - `standard`: Standard service tier.
  - `priority`: Priority service tier.

- **status** (`enum (string)`) *(Required)* Required. Output only. The status of the interaction.
  Possible values:
  - `in_progress`: The interaction is in progress.
  - `requires_action`: The interaction requires action/input from the user.
  - `completed`: The interaction is completed.
  - `failed`: The interaction failed.
  - `cancelled`: The interaction was cancelled.
  - `incomplete`: The interaction is completed, but contains incomplete results (e.g.
hitting max_tokens).
  - `budget_exceeded`: The interaction was halted because the token budget was exceeded.

- **steps** (`array (Step)`) Output only. The steps that make up the interaction, when included in the response.

- **system_instruction** (`string`) System instruction for the interaction.

- **tools** (`array (Tool)`) A list of tool declarations the model may call during interaction.

- **updated** (`string`) Output only. The time at which the response was last updated in ISO 8601 format (YYYY-MM-DDThh:mm:ssZ).

- **usage** (`Usage`) Output only. Statistics on the interaction request's token usage.
  - **cached_tokens_by_modality** (`array (ModalityTokens)`)   A breakdown of cached token usage by modality.
    - **modality** (`ResponseModality`)     The modality associated with the token count.
      Possible values:
      - `text`: Indicates the model should return text.
      - `image`: Indicates the model should return images.
      - `audio`: Indicates the model should return audio.
      - `video`: Indicates the model should return video.
      - `document`: Indicates the model should return documents.

    - **tokens** (`integer`)     Number of tokens for the modality.


  - **grounding_tool_count** (`array (GroundingToolCount)`)   Grounding tool count.
    - **count** (`integer`)     The number of grounding tool counts.

    - **type** (`enum (string)`)     The grounding tool type associated with the count.
      Possible values:
      - `google_search`: Grounding with Google Web Search and Image Search, & Web Grounding
for Enterprise.
      - `google_maps`: Grounding with Google Maps.
      - `retrieval`: Grounding with customer's data, for example, VertexAISearch.


  - **input_tokens_by_modality** (`array (ModalityTokens)`)   A breakdown of input token usage by modality.
    - **modality** (`ResponseModality`)     The modality associated with the token count.
      Possible values:
      - `text`: Indicates the model should return text.
      - `image`: Indicates the model should return images.
      - `audio`: Indicates the model should return audio.
      - `video`: Indicates the model should return video.
      - `document`: Indicates the model should return documents.

    - **tokens** (`integer`)     Number of tokens for the modality.


  - **output_tokens_by_modality** (`array (ModalityTokens)`)   A breakdown of output token usage by modality.
    - **modality** (`ResponseModality`)     The modality associated with the token count.
      Possible values:
      - `text`: Indicates the model should return text.
      - `image`: Indicates the model should return images.
      - `audio`: Indicates the model should return audio.
      - `video`: Indicates the model should return video.
      - `document`: Indicates the model should return documents.

    - **tokens** (`integer`)     Number of tokens for the modality.


  - **tool_use_tokens_by_modality** (`array (ModalityTokens)`)   A breakdown of tool-use token usage by modality.
    - **modality** (`ResponseModality`)     The modality associated with the token count.
      Possible values:
      - `text`: Indicates the model should return text.
      - `image`: Indicates the model should return images.
      - `audio`: Indicates the model should return audio.
      - `video`: Indicates the model should return video.
      - `document`: Indicates the model should return documents.

    - **tokens** (`integer`)     Number of tokens for the modality.


  - **total_cached_tokens** (`integer`)   Number of tokens in the cached part of the prompt (the cached content).

  - **total_input_tokens** (`integer`)   Number of tokens in the prompt (context).

  - **total_output_tokens** (`integer`)   Total number of tokens across all the generated responses.

  - **total_thought_tokens** (`integer`)   Number of tokens of thoughts for thinking models.

  - **total_tokens** (`integer`)   Total token count for the interaction request (prompt + responses + other internal tokens).

  - **total_tool_use_tokens** (`integer`)   Number of tokens present in tool-use prompt(s).


- **webhook_config** (`WebhookConfig`) Optional. Webhook configuration for receiving notifications when the interaction completes.
  - **uris** (`array (string)`)   Optional. If set, these webhook URIs will be used for webhook events instead of the registered webhooks.

  - **user_metadata** (`object`)   Optional. The user metadata that will be returned on each event emission to the webhooks.



**JSON Representation:**
```json
{
  "created": "2025-12-04T15:01:45Z",
  "id": "v1_ChdXS0l4YWZXTk9xbk0xZThQczhEcmlROBIXV0tJeGFmV05PcW5NMWU4UHM4RHJpUTg",
  "model": "gemini-3.5-flash",
  "object": "interaction",
  "steps": [
    {
      "type": "model_output",
      "content": [
        {
          "type": "text",
          "text": "Hello! I'm doing well, functioning as expected. Thank you for asking! How are you doing today?"
        }
      ]
    }
  ],
  "status": "completed",
  "updated": "2025-12-04T15:01:45Z",
  "usage": {
    "input_tokens_by_modality": [
      {
        "modality": "text",
        "tokens": 7
      }
    ],
    "total_cached_tokens": 0,
    "total_input_tokens": 7,
    "total_output_tokens": 23,
    "total_thought_tokens": 49,
    "total_tokens": 79,
    "total_tool_use_tokens": 0
  }
}
```

**Examples**
**Example**

```json
{
  "created": "2025-12-04T15:01:45Z",
  "id": "v1_ChdXS0l4YWZXTk9xbk0xZThQczhEcmlROBIXV0tJeGFmV05PcW5NMWU4UHM4RHJpUTg",
  "model": "gemini-3.5-flash",
  "object": "interaction",
  "steps": [
    {
      "type": "model_output",
      "content": [
        {
          "type": "text",
          "text": "Hello! I'm doing well, functioning as expected. Thank you for asking! How are you doing today?"
        }
      ]
    }
  ],
  "status": "completed",
  "updated": "2025-12-04T15:01:45Z",
  "usage": {
    "input_tokens_by_modality": [
      {
        "modality": "text",
        "tokens": 7
      }
    ],
    "total_cached_tokens": 0,
    "total_input_tokens": 7,
    "total_output_tokens": 23,
    "total_thought_tokens": 49,
    "total_tokens": 79,
    "total_tool_use_tokens": 0
  }
}
```


## Data Models
### Content { #Resource:Content }
The content of the response.

**Polymorphic Types:** (Discriminator: `type`)- **TextContent**
    - A text content block.
     - **annotations** (`array (Annotation)`)  Citation information for model-generated content.
   **Possible Types:** (Discriminator: `type`)
   - **UrlCitation**: A URL citation annotation.
   - **end_index** (`integer`)    End of the attributed segment, exclusive.

   - **start_index** (`integer`)    Start of segment of the response that is attributed to this source.  Index indicates the start of the segment, measured in bytes.

   - **title** (`string`)    The title of the URL.

   - **type** (`object`) *(Required)*
     Value: `url_citation`
   - **url** (`string`)    The URL.

   - **FileCitation**: A file citation annotation.
   - **custom_metadata** (`object`)    User provided metadata about the retrieved context.

   - **document_uri** (`string`)    The URI of the file.

   - **end_index** (`integer`)    End of the attributed segment, exclusive.

   - **file_name** (`string`)    The name of the file.

   - **media_id** (`string`)    Media ID in-case of image citations, if applicable.

   - **page_number** (`integer`)    Page number of the cited document, if applicable.

   - **source** (`string`)    Source attributed for a portion of the text.

   - **start_index** (`integer`)    Start of segment of the response that is attributed to this source.  Index indicates the start of the segment, measured in bytes.

   - **type** (`object`) *(Required)*
     Value: `file_citation`
   - **PlaceCitation**: A place citation annotation.
   - **end_index** (`integer`)    End of the attributed segment, exclusive.

   - **name** (`string`)    Title of the place.

   - **place_id** (`string`)    The ID of the place, in `places/{place_id}` format.

   - **review_snippets** (`array (ReviewSnippet)`)    Snippets of reviews that are used to generate answers about the features of a given place in Google Maps.
     - **review_id** (`string`)      The ID of the review snippet.

     - **title** (`string`)      Title of the review.

     - **url** (`string`)      A link that corresponds to the user review on Google Maps.


   - **start_index** (`integer`)    Start of segment of the response that is attributed to this source.  Index indicates the start of the segment, measured in bytes.

   - **type** (`object`) *(Required)*
     Value: `place_citation`
   - **url** (`string`)    URI reference of the place.


     - **text** (`string`) *(Required)*  Required. The text content.

     - **type** (`object`) *(Required)*
   Value: `text`
    **Examples**
    **Text**


    ```json
    {
  "type": "text",
  "text": "Hello, how are you?"
}
    ```
- **ImageContent**
    - An image content block.
     - **data** (`string`)  The image content.

     - **mime_type** (`enum (string)`)  The mime type of the image.
   Possible values:
   - `image/png`: PNG image format
   - `image/jpeg`: JPEG image format
   - `image/webp`: WebP image format
   - `image/heic`: HEIC image format
   - `image/heif`: HEIF image format
   - `image/gif`: GIF image format
   - `image/bmp`: BMP image format
   - `image/tiff`: TIFF image format

     - **resolution** (`MediaResolution`)  The resolution of the media.
   Possible values:
   - `low`: Low resolution.
   - `medium`: Medium resolution.
   - `high`: High resolution.
   - `ultra_high`: Ultra high resolution.

     - **type** (`object`) *(Required)*
   Value: `image`
     - **uri** (`string`)  The URI of the image.

    **Examples**
    **Image**


    ```json
    {
  "type": "image",
  "data": "BASE64_ENCODED_IMAGE",
  "mime_type": "image/png"
}
    ```
- **AudioContent**
    - An audio content block.
     - **channels** (`integer`)  The number of audio channels.

     - **data** (`string`)  The audio content.

     - **mime_type** (`enum (string)`)  The mime type of the audio.
   Possible values:
   - `audio/wav`: WAV audio format
   - `audio/mp3`: MP3 audio format
   - `audio/aiff`: AIFF audio format
   - `audio/aac`: AAC audio format
   - `audio/ogg`: OGG audio format
   - `audio/flac`: FLAC audio format
   - `audio/mpeg`: MPEG audio format
   - `audio/m4a`: M4A audio format
   - `audio/l16`: L16 audio format
   - `audio/opus`: OPUS audio format
   - `audio/alaw`: ALAW audio format
   - `audio/mulaw`: MULAW audio format

     - **sample_rate** (`integer`)  The sample rate of the audio.

     - **type** (`object`) *(Required)*
   Value: `audio`
     - **uri** (`string`)  The URI of the audio.

    **Examples**
    **Audio**


    ```json
    {
  "type": "audio",
  "data": "BASE64_ENCODED_AUDIO",
  "mime_type": "audio/wav"
}
    ```
- **DocumentContent**
    - A document content block.
     - **data** (`string`)  The document content.

     - **mime_type** (`enum (string)`)  The mime type of the document.
   Possible values:
   - `application/pdf`: PDF document format
   - `text/csv`: CSV document format

     - **type** (`object`) *(Required)*
   Value: `document`
     - **uri** (`string`)  The URI of the document.

    **Examples**
    **Document**


    ```json
    {
  "type": "document",
  "data": "BASE64_ENCODED_DOCUMENT",
  "mime_type": "application/pdf"
}
    ```
- **VideoContent**
    - A video content block.
     - **data** (`string`)  The video content.

     - **mime_type** (`enum (string)`)  The mime type of the video.
   Possible values:
   - `video/mp4`: MP4 video format
   - `video/mpeg`: MPEG video format
   - `video/mpg`: MPG video format
   - `video/mov`: MOV video format
   - `video/avi`: AVI video format
   - `video/x-flv`: FLV video format
   - `video/webm`: WebM video format
   - `video/wmv`: WMV video format
   - `video/3gpp`: 3GPP video format

     - **resolution** (`MediaResolution`)  The resolution of the media.
   Possible values:
   - `low`: Low resolution.
   - `medium`: Medium resolution.
   - `high`: High resolution.
   - `ultra_high`: Ultra high resolution.

     - **type** (`object`) *(Required)*
   Value: `video`
     - **uri** (`string`)  The URI of the video.

    **Examples**
    **Video**


    ```json
    {
  "type": "video",
  "uri": "https://www.youtube.com/watch?v=9hE5-98ZeCg"
}
    ```

**JSON Representation:**
```json
{
  "annotations": [
    {
      "end_index": 0,
      "start_index": 0,
      "title": "string",
      "type": {},
      "url": "string"
    }
  ],
  "text": "string",
  "type": {}
}
```


### Tool { #Resource:Tool }
A tool that can be used by the model.

**Polymorphic Types:** (Discriminator: `type`)- **Function**
    - A tool that can be used by the model.
     - **description** (`string`)  A description of the function.

     - **name** (`string`)  The name of the function.

     - **parameters** (`object`)  The JSON Schema for the function's parameters.

     - **type** (`object`) *(Required)*
   Value: `function`
    **Examples**
    **function_calling**

    ```sh
    curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "model": "gemini-3.5-flash",
    "tools": [{
      "type": "function",
      "name": "get_weather",
      "description": "Get the current weather in a given location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state, e.g. San Francisco, CA"
          }
        },
        "required": ["location"]
      }
    }],
    "input": "What is the weather like in Boston, MA?"
  }'

    ```
    **function_calling**

    ```python
    from google import genai

client = genai.Client()
response = client.interactions.create(
    model="gemini-3.5-flash",
    tools=[{
        "type": "function",
        "name": "get_weather",
        "description": "Get the current weather in a given location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and state, e.g. San Francisco, CA"
                }
            },
            "required": ["location"]
        }
    }],
    input="What is the weather like in Boston?"
)
print(response.steps[-1])

    ```
    **function_calling**

    ```javascript
    import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    model: 'gemini-3.5-flash',
    tools: [{
        type: 'function',
        name: 'get_weather',
        description: 'Get the current weather in a given location',
        parameters: {
            type: 'object',
            properties: {
                location: {
                    type: 'string',
                    description: 'The city and state, e.g. San Francisco, CA'
                }
            },
            required: ['location']
        }
    }],
    input: 'What is the weather like in Boston?'
});
console.log(interaction.steps.at(-1));

    ```
- **CodeExecution**
    - A tool that can be used by the model to execute code.
     - **type** (`object`) *(Required)*
   Value: `code_execution`
    **Examples**
    **code_execution**

    ```sh
    curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "model": "gemini-3.5-flash",
    "tools": [{
      "type": "code_execution"
    }],
    "input": "Calculate the first 10 Fibonacci numbers"
  }'

    ```
    **code_execution**

    ```python
    from google import genai

client = genai.Client()
response = client.interactions.create(
    model="gemini-3.5-flash",
    tools=[{"type": "code_execution"}],
    input="Calculate the first 10 Fibonacci numbers"
)
print(response.output_text)

    ```
    **code_execution**

    ```javascript
    import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    model: 'gemini-3.5-flash',
    tools: [{ type: 'code_execution' }],
    input: 'Calculate the first 10 Fibonacci numbers'
});
console.log(interaction.output_text);

    ```
- **UrlContext**
    - A tool that can be used by the model to fetch URL context.
     - **type** (`object`) *(Required)*
   Value: `url_context`
    **Examples**
    **url_context**

    ```sh
    curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "model": "gemini-3.5-flash",
    "tools": [{
      "type": "url_context"
    }],
    "input": "Summarize https://www.example.com"
  }'

    ```
    **url_context**

    ```python
    from google import genai

client = genai.Client()
response = client.interactions.create(
    model="gemini-3.5-flash",
    tools=[{"type": "url_context"}],
    input="Summarize https://www.example.com"
)
print(response.output_text)

    ```
    **url_context**

    ```javascript
    import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    model: 'gemini-3.5-flash',
    tools: [{ type: 'url_context' }],
    input: 'Summarize https://www.example.com'
});
console.log(interaction.output_text);

    ```
- **ComputerUse**
    - A tool that can be used by the model to interact with the computer.
     - **disabled_safety_policies** (`array (enum (string))`)  Optional. Disabled safety policies for computer use.
   Possible values:
   - `financial_transactions`: Safety policy for financial transactions.
   - `sensitive_data_modification`: Safety policy for sensitive data modification.
   - `communication_tool`: Safety policy for communication tools (e.g. Gmail, Chat, Meet).
   - `account_creation`: Safety policy for account creation.
   - `data_modification`: Safety policy for data modification.
   - `user_consent_management`: Safety policy for user consent management.
   - `legal_terms_and_agreements`: Safety policy for legal terms and agreements.

     - **enable_prompt_injection_detection** (`boolean`)  Whether enable the prompt injection detection check on computer-use request.

     - **environment** (`enum (string)`)  The environment being operated.
   Possible values:
   - `browser`: Operates in a web browser.
   - `mobile`: Operates in a mobile environment.
   - `desktop`: Operates in a desktop environment.

     - **excluded_predefined_functions** (`array (string)`)  The list of predefined functions that are excluded from the model call.

     - **type** (`object`) *(Required)*
   Value: `computer_use`
    **Examples**
    **computer_use**

    ```sh
    curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "model": "gemini-2.5-computer-use-preview-10-2025",
    "tools": [{
      "type": "computer_use"
    }],
    "input": "Find a flight to Tokyo"
  }'

    ```
    **computer_use**

    ```python
    from google import genai

client = genai.Client()
response = client.interactions.create(
    model="gemini-2.5-computer-use-preview-10-2025",
    tools=[{"type": "computer_use"}],
    input="Find a flight to Tokyo"
)
print(response.output_text)

    ```
    **computer_use**

    ```javascript
    import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    model: 'gemini-2.5-computer-use-preview-10-2025',
    tools: [{ type: 'computer_use'}],
    input: 'Find a flight to Tokyo'
});
console.log(interaction.output_text);

    ```
- **McpServer**
    - A MCPServer is a server that can be called by the model to perform actions.
     - **allowed_tools** (`array (AllowedTools)`)  The allowed tools.
   - **mode** (`enum (string)`)    The mode of the tool choice.
     Possible values:
     - `auto`: Auto tool choice.
     - `any`: Any tool choice.
     - `none`: No tool choice.
     - `validated`: Validated tool choice.

   - **tools** (`array (string)`)    The names of the allowed tools.


     - **headers** (`object`)  Optional: Fields for authentication headers, timeouts, etc., if needed.

     - **name** (`string`)  The name of the MCPServer.

     - **type** (`object`) *(Required)*
   Value: `mcp_server`
     - **url** (`string`)  The full URL for the MCPServer endpoint. Example: "https://api.example.com/mcp"

    **Examples**
    **mcp_server**

    ```sh
    curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "model": "gemini-3.5-flash",
    "tools": [{
      "type": "mcp_server",
      "name": "weather_service",
      "url": "https://gemini-api-demos.uc.r.appspot.com/mcp"
    }],
    "input": "Today is 12-05-2025, what is the temperature today in London?"
  }'

    ```
    **mcp_server**

    ```python
    from google import genai

client = genai.Client()
response = client.interactions.create(
    model="gemini-3.5-flash",
    tools=[{
        "type": "mcp_server",
        "name": "weather_service",
        "url": "https://gemini-api-demos.uc.r.appspot.com/mcp"
    }],
    input="Today is 12-05-2025, what is the temperature today in London?"
)
print(response.output_text)

    ```
    **mcp_server**

    ```javascript
    import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    model: 'gemini-3.5-flash',
    tools: [{
        type: 'mcp_server',
        name: 'weather_service',
        url: 'https://gemini-api-demos.uc.r.appspot.com/mcp'
    }],
    input: 'Today is 12-05-2025, what is the temperature today in London?'
});
console.log(interaction.output_text);

    ```
- **GoogleSearch**
    - A tool that can be used by the model to search Google.
     - **search_types** (`array (enum (string))`)  The types of search grounding to enable.
   Possible values:
   - `web_search`: Setting this field enables web search. Only text results are returned.
   - `image_search`: Setting this field enables image search. Image bytes are returned.
   - `enterprise_web_search`: Setting this field enables enterprise web search.

     - **type** (`object`) *(Required)*
   Value: `google_search`
    **Examples**
    **google_search**

    ```sh
    curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "model": "gemini-3.5-flash",
    "tools": [{
      "type": "google_search"
    }],
    "input": "Who is the current president of France?"
  }'

    ```
    **google_search**

    ```python
    from google import genai

client = genai.Client()
response = client.interactions.create(
    model="gemini-3.5-flash",
    tools=[{"type": "google_search"}],
    input="Who is the current president of France?"
)
print(response.output_text)

    ```
    **google_search**

    ```javascript
    import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    model: 'gemini-3.5-flash',
    tools: [{ type: 'google_search' }],
    input: 'Who is the current president of France?'
});
console.log(interaction.output_text);

    ```
- **FileSearch**
    - A tool that can be used by the model to search files.
     - **file_search_store_names** (`array (string)`)  The file search store names to search.

     - **metadata_filter** (`string`)  Metadata filter to apply to the semantic retrieval documents and chunks.

     - **top_k** (`integer`)  The number of semantic retrieval chunks to retrieve.

     - **type** (`object`) *(Required)*
   Value: `file_search`
    **Examples**
    **file_search**

    ```sh
    curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "model": "gemini-3.5-flash",
    "tools": [{
      "type": "file_search",
      "file_search_store_names": ["fileSearchStores/m64d1sevsr4y-xfyawui3fxqg"]
    }],
    "input": "Who is the author of the book?"
  }'

    ```
    **file_search**

    ```python
    from google import genai

client = genai.Client()

# Create a file search store so we have a valid one to use.
store = client.file_search_stores.create()

response = client.interactions.create(
    model="gemini-3.5-flash",
    tools=[{
        "type": "file_search",
        "file_search_store_names": [store.name]
    }],
    input="What documents are available?"
)
print(response.output_text)

# [cleanup]
client.file_search_stores.delete(name=store.name)
# [/cleanup]

    ```
    **file_search**

    ```javascript
    import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});

// Create a file search store so we have a valid one to use.
const store = await ai.fileSearchStores.create({});
if (!store.name) {
    throw new Error('Store creation failed: Name is undefined');
}

const interaction = await ai.interactions.create({
    model: 'gemini-3.5-flash',
    tools: [{
        type: 'file_search',
        file_search_store_names: [store.name]
    }],
    input: 'What documents are available?'
});
console.log(interaction.output_text);

// [cleanup]
await ai.fileSearchStores.delete({name: store.name});
// [/cleanup]

    ```
- **GoogleMaps**
    - A tool that can be used by the model to call Google Maps.
     - **enable_widget** (`boolean`)  Whether to return a widget context token in the tool call result of the response.

     - **latitude** (`number`)  The latitude of the user's location.

     - **longitude** (`number`)  The longitude of the user's location.

     - **type** (`object`) *(Required)*
   Value: `google_maps`
    **Examples**
    **google_maps**

    ```sh
    curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Api-Revision: 2026-05-20" \
  -d '{
    "model": "gemini-3.5-flash",
    "tools": [{
      "type": "google_maps",
      "latitude": 37.7749,
      "longitude": -122.4194
    }],
    "input": "What is the best food near me?"
  }'

    ```
    **google_maps**

    ```python
    from google import genai

client = genai.Client()
response = client.interactions.create(
    model="gemini-3.5-flash",
    tools=[{
        "type": "google_maps",
        "latitude": 37.7749,
        "longitude": -122.4194
    }],
    input="What is the best food near me?"
)
print(response.output_text)

    ```
    **google_maps**

    ```javascript
    import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({});
const interaction = await ai.interactions.create({
    model: 'gemini-3.5-flash',
    tools: [{
        type: 'google_maps',
        latitude: 37.7749,
        longitude: -122.4194
    }],
    input: 'What is the best food near me?'
});
console.log(interaction.output_text);

    ```
- **Retrieval**
    - A tool that can be used by the model to retrieve files.
     - **exa_ai_search_config** (`ExaAISearchConfig`)  Used to specify configuration for ExaAISearch.
   - **api_key** (`string`) *(Required)*    Required. The API key for ExaAiSearch.

   - **custom_config** (`object`)    Optional. This field can be used to pass any parameter from the Exa.ai Search API.


     - **parallel_ai_search_config** (`ParallelAISearchConfig`)  Used to specify configuration for ParallelAISearch.
   - **api_key** (`string`)    Optional. The API key for ParallelAiSearch.

   - **custom_config** (`object`)    Optional. Custom configs for ParallelAiSearch.


     - **rag_store_config** (`RagStoreConfig`)  Used to specify configuration for RagStore.
   - **rag_resources** (`array (RagResource)`)    Optional. The representation of the rag source.
     - **rag_corpus** (`string`)      Optional. RagCorpora resource name.

     - **rag_file_ids** (`array (string)`)      Optional. rag_file_id. The files should be in the same rag_corpus set in rag_corpus field.


   - **rag_retrieval_config** (`RagRetrievalConfig`)    Optional. The retrieval config for the Rag query.
     - **filter** (`Filter`)      Optional. Config for filters.
       - **metadata_filter** (`string`)        Optional. String for metadata filtering.

       - **vector_distance_threshold** (`number`)        Optional. Only returns contexts with vector distance smaller than the threshold.

       - **vector_similarity_threshold** (`number`)        Optional. Only returns contexts with vector similarity larger than the threshold.


     - **hybrid_search** (`HybridSearch`)      Optional. Config for Hybrid Search.
       - **alpha** (`number`)        Optional. Alpha value controls the weight between dense and sparse vector search results.


     - **ranking** (`Ranking`)      Optional. Config for ranking and reranking.

     - **top_k** (`integer`)      Optional. The number of contexts to retrieve.



     - **retrieval_types** (`array (enum (string))`)  The types of file retrieval to enable.
   Possible values:
   - `rag_store`
   - `exa_ai_search`
   - `parallel_ai_search`

     - **type** (`object`) *(Required)*
   Value: `retrieval`

**JSON Representation:**
```json
{
  "description": "string",
  "name": "string",
  "parameters": {},
  "type": {}
}
```


### InteractionSseEvent { #Resource:InteractionSseEvent }


**Polymorphic Types:** (Discriminator: `event_type`)- **InteractionCreatedEvent**
    -
     - **event_id** (`string`)  The event_id token to be used to resume the interaction stream, from this event.

     - **event_type** (`object`) *(Required)*
   Value: `interaction.created`
     - **interaction** (`InteractionSseEventInteraction`) *(Required)*  Partial interaction resource emitted when the stream is created.
   - **agent** (`string`)    The agent to interact with.

   - **created** (`string`)    Output only. The time at which the response was created in ISO 8601 format.

   - **id** (`string`) *(Required)*    Required. Output only. A unique identifier for the interaction completion.

   - **model** (`string`)    The model that will complete your prompt.

   - **object** (`string`)    Output only. The resource type.

   - **service_tier** (`ServiceTier`)    The service tier for the interaction.
     Possible values:
     - `flex`: Flex service tier.
     - `standard`: Standard service tier.
     - `priority`: Priority service tier.

   - **status** (`enum (string)`) *(Required)*    Required. Output only. The status of the interaction.
     Possible values:
     - `in_progress`: The interaction is in progress.
     - `requires_action`: The interaction requires action/input from the user.
     - `completed`: The interaction is completed.
     - `failed`: The interaction failed.
     - `cancelled`: The interaction was cancelled.
     - `incomplete`: The interaction is completed, but contains incomplete results (e.g. hitting max_tokens).

   - **steps** (`array (Step)`)    Output only. The steps that make up the interaction, if included in this event.

   - **updated** (`string`)    Output only. The time at which the response was last updated in ISO 8601 format.

   - **usage** (`Usage`)    Output only. Statistics on the interaction request's token usage.
     - **cached_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of cached token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **grounding_tool_count** (`array (GroundingToolCount)`)      Grounding tool count.
       - **count** (`integer`)        The number of grounding tool counts.

       - **type** (`enum (string)`)        The grounding tool type associated with the count.
         Possible values:
         - `google_search`: Grounding with Google Web Search and Image Search, & Web Grounding
for Enterprise.
         - `google_maps`: Grounding with Google Maps.
         - `retrieval`: Grounding with customer's data, for example, VertexAISearch.


     - **input_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of input token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **output_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of output token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **tool_use_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of tool-use token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **total_cached_tokens** (`integer`)      Number of tokens in the cached part of the prompt (the cached content).

     - **total_input_tokens** (`integer`)      Number of tokens in the prompt (context).

     - **total_output_tokens** (`integer`)      Total number of tokens across all the generated responses.

     - **total_thought_tokens** (`integer`)      Number of tokens of thoughts for thinking models.

     - **total_tokens** (`integer`)      Total token count for the interaction request (prompt + responses + other internal tokens).

     - **total_tool_use_tokens** (`integer`)      Number of tokens present in tool-use prompt(s).



     - **metadata** (`StreamMetadata`)  Optional metadata accompanying ANY streamed event.
   - **total_usage** (`Usage`)
     - **cached_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of cached token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **grounding_tool_count** (`array (GroundingToolCount)`)      Grounding tool count.
       - **count** (`integer`)        The number of grounding tool counts.

       - **type** (`enum (string)`)        The grounding tool type associated with the count.
         Possible values:
         - `google_search`: Grounding with Google Web Search and Image Search, & Web Grounding
for Enterprise.
         - `google_maps`: Grounding with Google Maps.
         - `retrieval`: Grounding with customer's data, for example, VertexAISearch.


     - **input_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of input token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **output_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of output token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **tool_use_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of tool-use token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **total_cached_tokens** (`integer`)      Number of tokens in the cached part of the prompt (the cached content).

     - **total_input_tokens** (`integer`)      Number of tokens in the prompt (context).

     - **total_output_tokens** (`integer`)      Total number of tokens across all the generated responses.

     - **total_thought_tokens** (`integer`)      Number of tokens of thoughts for thinking models.

     - **total_tokens** (`integer`)      Total token count for the interaction request (prompt + responses + other internal tokens).

     - **total_tool_use_tokens** (`integer`)      Number of tokens present in tool-use prompt(s).



    **Examples**
    **Interaction Created**


    ```json
    {
  "event_type": "interaction.created",
  "interaction": {
    "id": "v1_ChdXS0l4YWZXTk9xbk0xZThQczhEcmlROBIXV0tJeGFmV05PcW5NMWU4UHM4RHJpUTg",
    "model": "gemini-3.5-flash",
    "status": "in_progress",
    "created": "2025-12-04T15:01:45Z",
    "updated": "2025-12-04T15:01:45Z"
  },
  "event_id": "evt_123"
}
    ```
    **Interaction Created**


    ```json
    {
  "event_type": "interaction.created",
  "interaction": {
    "id": "v1_ChdXS0l4YWZXTk9xbk0xZThQczhEcmlROBIXV0tJeGFmV05PcW5NMWU4UHM4RHJpUTg",
    "model": "gemini-3-flash-preview",
    "object": "interaction",
    "status": "in_progress"
  },
  "event_id": "evt_123"
}
    ```
- **InteractionCompletedEvent**
    -
     - **event_id** (`string`)  The event_id token to be used to resume the interaction stream, from this event.

     - **event_type** (`object`) *(Required)*
   Value: `interaction.completed`
     - **interaction** (`InteractionSseEventInteraction`) *(Required)*  Partial completed interaction resource emitted at the end of the stream.
   - **agent** (`string`)    The agent to interact with.

   - **created** (`string`)    Output only. The time at which the response was created in ISO 8601 format.

   - **id** (`string`) *(Required)*    Required. Output only. A unique identifier for the interaction completion.

   - **model** (`string`)    The model that will complete your prompt.

   - **object** (`string`)    Output only. The resource type.

   - **service_tier** (`ServiceTier`)    The service tier for the interaction.
     Possible values:
     - `flex`: Flex service tier.
     - `standard`: Standard service tier.
     - `priority`: Priority service tier.

   - **status** (`enum (string)`) *(Required)*    Required. Output only. The status of the interaction.
     Possible values:
     - `in_progress`: The interaction is in progress.
     - `requires_action`: The interaction requires action/input from the user.
     - `completed`: The interaction is completed.
     - `failed`: The interaction failed.
     - `cancelled`: The interaction was cancelled.
     - `incomplete`: The interaction is completed, but contains incomplete results (e.g. hitting max_tokens).

   - **steps** (`array (Step)`)    Output only. The steps that make up the interaction, if included in this event.

   - **updated** (`string`)    Output only. The time at which the response was last updated in ISO 8601 format.

   - **usage** (`Usage`)    Output only. Statistics on the interaction request's token usage.
     - **cached_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of cached token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **grounding_tool_count** (`array (GroundingToolCount)`)      Grounding tool count.
       - **count** (`integer`)        The number of grounding tool counts.

       - **type** (`enum (string)`)        The grounding tool type associated with the count.
         Possible values:
         - `google_search`: Grounding with Google Web Search and Image Search, & Web Grounding
for Enterprise.
         - `google_maps`: Grounding with Google Maps.
         - `retrieval`: Grounding with customer's data, for example, VertexAISearch.


     - **input_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of input token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **output_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of output token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **tool_use_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of tool-use token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **total_cached_tokens** (`integer`)      Number of tokens in the cached part of the prompt (the cached content).

     - **total_input_tokens** (`integer`)      Number of tokens in the prompt (context).

     - **total_output_tokens** (`integer`)      Total number of tokens across all the generated responses.

     - **total_thought_tokens** (`integer`)      Number of tokens of thoughts for thinking models.

     - **total_tokens** (`integer`)      Total token count for the interaction request (prompt + responses + other internal tokens).

     - **total_tool_use_tokens** (`integer`)      Number of tokens present in tool-use prompt(s).



     - **metadata** (`StreamMetadata`)  Optional metadata accompanying ANY streamed event.
   - **total_usage** (`Usage`)
     - **cached_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of cached token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **grounding_tool_count** (`array (GroundingToolCount)`)      Grounding tool count.
       - **count** (`integer`)        The number of grounding tool counts.

       - **type** (`enum (string)`)        The grounding tool type associated with the count.
         Possible values:
         - `google_search`: Grounding with Google Web Search and Image Search, & Web Grounding
for Enterprise.
         - `google_maps`: Grounding with Google Maps.
         - `retrieval`: Grounding with customer's data, for example, VertexAISearch.


     - **input_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of input token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **output_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of output token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **tool_use_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of tool-use token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **total_cached_tokens** (`integer`)      Number of tokens in the cached part of the prompt (the cached content).

     - **total_input_tokens** (`integer`)      Number of tokens in the prompt (context).

     - **total_output_tokens** (`integer`)      Total number of tokens across all the generated responses.

     - **total_thought_tokens** (`integer`)      Number of tokens of thoughts for thinking models.

     - **total_tokens** (`integer`)      Total token count for the interaction request (prompt + responses + other internal tokens).

     - **total_tool_use_tokens** (`integer`)      Number of tokens present in tool-use prompt(s).



    **Examples**
    **Interaction Completed**


    ```json
    {
  "event_type": "interaction.completed",
  "interaction": {
    "id": "v1_ChdXS0l4YWZXTk9xbk0xZThQczhEcmlROBIXV0tJeGFmV05PcW5NMWU4UHM4RHJpUTg",
    "model": "gemini-3.5-flash",
    "status": "completed",
    "created": "2025-12-04T15:01:45Z",
    "updated": "2025-12-04T15:01:45Z"
  },
  "event_id": "evt_123"
}
    ```
    **Interaction Completed**


    ```json
    {
  "event_type": "interaction.completed",
  "interaction": {
    "id": "v1_ChdXS0l4YWZXTk9xbk0xZThQczhEcmlROBIXV0tJeGFmV05PcW5NMWU4UHM4RHJpUTg",
    "model": "gemini-3-flash-preview",
    "object": "interaction",
    "status": "completed",
    "created": "2025-12-04T15:01:45Z",
    "updated": "2025-12-04T15:01:45Z"
  },
  "event_id": "evt_123"
}
    ```
- **InteractionStatusUpdate**
    -
     - **event_id** (`string`)  The event_id token to be used to resume the interaction stream, from this event.

     - **event_type** (`object`) *(Required)*
   Value: `interaction.status_update`
     - **interaction_id** (`string`) *(Required)*

     - **metadata** (`StreamMetadata`)  Optional metadata accompanying ANY streamed event.
   - **total_usage** (`Usage`)
     - **cached_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of cached token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **grounding_tool_count** (`array (GroundingToolCount)`)      Grounding tool count.
       - **count** (`integer`)        The number of grounding tool counts.

       - **type** (`enum (string)`)        The grounding tool type associated with the count.
         Possible values:
         - `google_search`: Grounding with Google Web Search and Image Search, & Web Grounding
for Enterprise.
         - `google_maps`: Grounding with Google Maps.
         - `retrieval`: Grounding with customer's data, for example, VertexAISearch.


     - **input_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of input token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **output_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of output token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **tool_use_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of tool-use token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **total_cached_tokens** (`integer`)      Number of tokens in the cached part of the prompt (the cached content).

     - **total_input_tokens** (`integer`)      Number of tokens in the prompt (context).

     - **total_output_tokens** (`integer`)      Total number of tokens across all the generated responses.

     - **total_thought_tokens** (`integer`)      Number of tokens of thoughts for thinking models.

     - **total_tokens** (`integer`)      Total token count for the interaction request (prompt + responses + other internal tokens).

     - **total_tool_use_tokens** (`integer`)      Number of tokens present in tool-use prompt(s).



     - **status** (`enum (string)`) *(Required)*
   Possible values:
   - `in_progress`: The interaction is in progress.
   - `requires_action`: The interaction requires action/input from the user.
   - `completed`: The interaction is completed.
   - `failed`: The interaction failed.
   - `cancelled`: The interaction was cancelled.
   - `incomplete`: The interaction is completed, but contains incomplete results (e.g.
hitting max_tokens).
   - `budget_exceeded`: The interaction was halted because the token budget was exceeded.

    **Examples**
    **Interaction Status Update**


    ```json
    {
  "event_type": "interaction.status_update",
  "interaction_id": "v1_ChdTMjQ0YWJ5TUF1TzcxZThQdjRpcnFRcxIXUzI0NGFieU1BdU83MWU4UHY0aXJxUXM",
  "status": "in_progress"
}
    ```
- **ErrorEvent**
    -
     - **error** (`Error`)
   - **code** (`string`)    A URI that identifies the error type.

   - **message** (`string`)    A human-readable error message.


     - **event_id** (`string`)  The event_id token to be used to resume the interaction stream, from this event.

     - **event_type** (`object`) *(Required)*
   Value: `error`
     - **metadata** (`StreamMetadata`)  Optional metadata accompanying ANY streamed event.
   - **total_usage** (`Usage`)
     - **cached_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of cached token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **grounding_tool_count** (`array (GroundingToolCount)`)      Grounding tool count.
       - **count** (`integer`)        The number of grounding tool counts.

       - **type** (`enum (string)`)        The grounding tool type associated with the count.
         Possible values:
         - `google_search`: Grounding with Google Web Search and Image Search, & Web Grounding
for Enterprise.
         - `google_maps`: Grounding with Google Maps.
         - `retrieval`: Grounding with customer's data, for example, VertexAISearch.


     - **input_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of input token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **output_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of output token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **tool_use_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of tool-use token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **total_cached_tokens** (`integer`)      Number of tokens in the cached part of the prompt (the cached content).

     - **total_input_tokens** (`integer`)      Number of tokens in the prompt (context).

     - **total_output_tokens** (`integer`)      Total number of tokens across all the generated responses.

     - **total_thought_tokens** (`integer`)      Number of tokens of thoughts for thinking models.

     - **total_tokens** (`integer`)      Total token count for the interaction request (prompt + responses + other internal tokens).

     - **total_tool_use_tokens** (`integer`)      Number of tokens present in tool-use prompt(s).



    **Examples**
    **Error Event**


    ```json
    {
  "event_type": "error",
  "error": {
    "message": "Failed to get completed interaction: Result not found.",
    "code": "not_found"
  }
}
    ```
- **StepStart**
    -
     - **event_id** (`string`)  The event_id token to be used to resume the interaction stream, from this event.

     - **event_type** (`object`) *(Required)*
   Value: `step.start`
     - **index** (`integer`) *(Required)*

     - **metadata** (`StreamMetadata`)  Optional metadata accompanying ANY streamed event.
   - **total_usage** (`Usage`)
     - **cached_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of cached token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **grounding_tool_count** (`array (GroundingToolCount)`)      Grounding tool count.
       - **count** (`integer`)        The number of grounding tool counts.

       - **type** (`enum (string)`)        The grounding tool type associated with the count.
         Possible values:
         - `google_search`: Grounding with Google Web Search and Image Search, & Web Grounding
for Enterprise.
         - `google_maps`: Grounding with Google Maps.
         - `retrieval`: Grounding with customer's data, for example, VertexAISearch.


     - **input_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of input token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **output_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of output token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **tool_use_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of tool-use token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **total_cached_tokens** (`integer`)      Number of tokens in the cached part of the prompt (the cached content).

     - **total_input_tokens** (`integer`)      Number of tokens in the prompt (context).

     - **total_output_tokens** (`integer`)      Total number of tokens across all the generated responses.

     - **total_thought_tokens** (`integer`)      Number of tokens of thoughts for thinking models.

     - **total_tokens** (`integer`)      Total token count for the interaction request (prompt + responses + other internal tokens).

     - **total_tool_use_tokens** (`integer`)      Number of tokens present in tool-use prompt(s).



     - **step** (`Step`) *(Required)*

    **Examples**
    **Step Start**


    ```json
    {
  "event_type": "step.start",
  "index": 0,
  "step": {
    "type": "model_output"
  }
}
    ```
- **StepDelta**
    -
     - **delta** (`StepDeltaData`) *(Required)*
   **Possible Types:** (Discriminator: `type`)
   - **TextDelta**:
   - **text** (`string`) *(Required)*

   - **type** (`object`) *(Required)*
     Value: `text`
   - **ImageDelta**:
   - **data** (`string`)

   - **mime_type** (`enum (string)`)
     Possible values:
     - `image/png`: PNG image format
     - `image/jpeg`: JPEG image format
     - `image/webp`: WebP image format
     - `image/heic`: HEIC image format
     - `image/heif`: HEIF image format
     - `image/gif`: GIF image format
     - `image/bmp`: BMP image format
     - `image/tiff`: TIFF image format

   - **resolution** (`MediaResolution`)    The resolution of the media.
     Possible values:
     - `low`: Low resolution.
     - `medium`: Medium resolution.
     - `high`: High resolution.
     - `ultra_high`: Ultra high resolution.

   - **type** (`object`) *(Required)*
     Value: `image`
   - **uri** (`string`)

   - **AudioDelta**:
   - **channels** (`integer`)    The number of audio channels.

   - **data** (`string`)

   - **mime_type** (`enum (string)`)
     Possible values:
     - `audio/wav`: WAV audio format
     - `audio/mp3`: MP3 audio format
     - `audio/aiff`: AIFF audio format
     - `audio/aac`: AAC audio format
     - `audio/ogg`: OGG audio format
     - `audio/flac`: FLAC audio format
     - `audio/mpeg`: MPEG audio format
     - `audio/m4a`: M4A audio format
     - `audio/l16`: L16 audio format
     - `audio/opus`: OPUS audio format
     - `audio/alaw`: ALAW audio format
     - `audio/mulaw`: MULAW audio format

   - **sample_rate** (`integer`)    The sample rate of the audio.

   - **type** (`object`) *(Required)*
     Value: `audio`
   - **uri** (`string`)

   - **DocumentDelta**:
   - **data** (`string`)

   - **mime_type** (`enum (string)`)
     Possible values:
     - `application/pdf`: PDF document format
     - `text/csv`: CSV document format

   - **type** (`object`) *(Required)*
     Value: `document`
   - **uri** (`string`)

   - **VideoDelta**:
   - **data** (`string`)

   - **mime_type** (`enum (string)`)
     Possible values:
     - `video/mp4`: MP4 video format
     - `video/mpeg`: MPEG video format
     - `video/mpg`: MPG video format
     - `video/mov`: MOV video format
     - `video/avi`: AVI video format
     - `video/x-flv`: FLV video format
     - `video/webm`: WebM video format
     - `video/wmv`: WMV video format
     - `video/3gpp`: 3GPP video format

   - **resolution** (`MediaResolution`)    The resolution of the media.
     Possible values:
     - `low`: Low resolution.
     - `medium`: Medium resolution.
     - `high`: High resolution.
     - `ultra_high`: Ultra high resolution.

   - **type** (`object`) *(Required)*
     Value: `video`
   - **uri** (`string`)

   - **ThoughtSummaryDelta**:
   - **content** (`Content`)    A new summary item to be added to the thought.

   - **type** (`object`) *(Required)*
     Value: `thought_summary`
   - **ThoughtSignatureDelta**:
   - **signature** (`string`)    Signature to match the backend source to be part of the generation.

   - **type** (`object`) *(Required)*
     Value: `thought_signature`
   - **TextAnnotationDelta**:
   - **annotations** (`array (Annotation)`)    Citation information for model-generated content.
     **Possible Types:** (Discriminator: `type`)
     - **UrlCitation**: A URL citation annotation.
     - **end_index** (`integer`)      End of the attributed segment, exclusive.

     - **start_index** (`integer`)      Start of segment of the response that is attributed to this source.  Index indicates the start of the segment, measured in bytes.

     - **title** (`string`)      The title of the URL.

     - **type** (`object`) *(Required)*
       Value: `url_citation`
     - **url** (`string`)      The URL.

     - **FileCitation**: A file citation annotation.
     - **custom_metadata** (`object`)      User provided metadata about the retrieved context.

     - **document_uri** (`string`)      The URI of the file.

     - **end_index** (`integer`)      End of the attributed segment, exclusive.

     - **file_name** (`string`)      The name of the file.

     - **media_id** (`string`)      Media ID in-case of image citations, if applicable.

     - **page_number** (`integer`)      Page number of the cited document, if applicable.

     - **source** (`string`)      Source attributed for a portion of the text.

     - **start_index** (`integer`)      Start of segment of the response that is attributed to this source.  Index indicates the start of the segment, measured in bytes.

     - **type** (`object`) *(Required)*
       Value: `file_citation`
     - **PlaceCitation**: A place citation annotation.
     - **end_index** (`integer`)      End of the attributed segment, exclusive.

     - **name** (`string`)      Title of the place.

     - **place_id** (`string`)      The ID of the place, in `places/{place_id}` format.

     - **review_snippets** (`array (ReviewSnippet)`)      Snippets of reviews that are used to generate answers about the features of a given place in Google Maps.
       - **review_id** (`string`)        The ID of the review snippet.

       - **title** (`string`)        Title of the review.

       - **url** (`string`)        A link that corresponds to the user review on Google Maps.


     - **start_index** (`integer`)      Start of segment of the response that is attributed to this source.  Index indicates the start of the segment, measured in bytes.

     - **type** (`object`) *(Required)*
       Value: `place_citation`
     - **url** (`string`)      URI reference of the place.


   - **type** (`object`) *(Required)*
     Value: `text_annotation_delta`
   - **ArgumentsDelta**:
   - **arguments** (`string`)

   - **type** (`object`) *(Required)*
     Value: `arguments_delta`
   - **CodeExecutionCallDelta**:
   - **arguments** (`CodeExecutionCallArguments`) *(Required)*
     - **code** (`string`)      The code to be executed.

     - **language** (`enum (string)`)      Programming language of the `code`.
       Possible values:
       - `python`: Python >= 3.10, with numpy and simpy available.


   - **signature** (`string`)    A signature hash for backend validation.

   - **type** (`object`) *(Required)*
     Value: `code_execution_call`
   - **UrlContextCallDelta**:
   - **arguments** (`UrlContextCallArguments`) *(Required)*
     - **urls** (`array (string)`)      The URLs to fetch.


   - **signature** (`string`)    A signature hash for backend validation.

   - **type** (`object`) *(Required)*
     Value: `url_context_call`
   - **GoogleSearchCallDelta**:
   - **arguments** (`GoogleSearchCallArguments`) *(Required)*
     - **queries** (`array (string)`)      Web search queries for the following-up web search.


   - **signature** (`string`)    A signature hash for backend validation.

   - **type** (`object`) *(Required)*
     Value: `google_search_call`
   - **McpServerToolCallDelta**:
   - **arguments** (`object`) *(Required)*

   - **name** (`string`) *(Required)*

   - **server_name** (`string`) *(Required)*

   - **type** (`object`) *(Required)*
     Value: `mcp_server_tool_call`
   - **FileSearchCallDelta**:
   - **signature** (`string`)    A signature hash for backend validation.

   - **type** (`object`) *(Required)*
     Value: `file_search_call`
   - **GoogleMapsCallDelta**:
   - **arguments** (`GoogleMapsCallArguments`)    The arguments to pass to the Google Maps tool.
     - **queries** (`array (string)`)      The queries to be executed.


   - **signature** (`string`)    A signature hash for backend validation.

   - **type** (`object`) *(Required)*
     Value: `google_maps_call`
   - **RetrievalCallDelta**: Used by Vertex Retrieval tools such as Parallel AI, Exa AI, Vertex AI Search, etc. RetrievalType decides which tool is used.
   - **arguments** (`RetrievalStepArguments`) *(Required)*    Required. The arguments to pass to the Retrieval tool.
     - **queries** (`array (string)`)      Queries for Retrieval information.


   - **retrieval_type** (`enum (string)`)    The type of retrieval tools.
     Possible values:
     - `rag_store`: The type of retrieval tools.
     - `exa_ai_search`: The type of retrieval tools.
     - `parallel_ai_search`: The type of retrieval tools.

   - **signature** (`string`)    A signature hash for backend validation.

   - **type** (`object`) *(Required)*
     Value: `retrieval_call`
   - **CodeExecutionResultDelta**:
   - **is_error** (`boolean`)

   - **result** (`string`) *(Required)*

   - **signature** (`string`)    A signature hash for backend validation.

   - **type** (`object`) *(Required)*
     Value: `code_execution_result`
   - **UrlContextResultDelta**:
   - **is_error** (`boolean`)

   - **result** (`array (UrlContextResult)`) *(Required)*
     - **status** (`enum (string)`)      The status of the URL retrieval.
       Possible values:
       - `success`: Url retrieval is successful.
       - `error`: Url retrieval is failed due to error.
       - `paywall`: Url retrieval is failed because the content is behind paywall.
       - `unsafe`: Url retrieval is failed because the content is unsafe.

     - **url** (`string`)      The URL that was fetched.


   - **signature** (`string`)    A signature hash for backend validation.

   - **type** (`object`) *(Required)*
     Value: `url_context_result`
   - **GoogleSearchResultDelta**:
   - **is_error** (`boolean`)

   - **result** (`array (GoogleSearchResult)`) *(Required)*
     - **search_suggestions** (`string`)      Web content snippet that can be embedded in a web page or an app webview.


   - **signature** (`string`)    A signature hash for backend validation.

   - **type** (`object`) *(Required)*
     Value: `google_search_result`
   - **McpServerToolResultDelta**:
   - **name** (`string`)

   - **result** (`array (ImageContent or TextContent) or object or string`) *(Required)*

   - **server_name** (`string`)

   - **type** (`object`) *(Required)*
     Value: `mcp_server_tool_result`
   - **FileSearchResultDelta**:
   - **result** (`array (FileSearchResult)`) *(Required)*

   - **signature** (`string`)    A signature hash for backend validation.

   - **type** (`object`) *(Required)*
     Value: `file_search_result`
   - **GoogleMapsResultDelta**:
   - **result** (`array (GoogleMapsResult)`)    The results of the Google Maps.
     - **places** (`array (Places)`)      The places that were found.
       - **name** (`string`)        Title of the place.

       - **place_id** (`string`)        The ID of the place, in `places/{place_id}` format.

       - **review_snippets** (`array (ReviewSnippet)`)        Snippets of reviews that are used to generate answers about the features of a given place in Google Maps.
         - **review_id** (`string`)          The ID of the review snippet.

         - **title** (`string`)          Title of the review.

         - **url** (`string`)          A link that corresponds to the user review on Google Maps.


       - **url** (`string`)        URI reference of the place.


     - **widget_context_token** (`string`)      Resource name of the Google Maps widget context token.


   - **signature** (`string`)    A signature hash for backend validation.

   - **type** (`object`) *(Required)*
     Value: `google_maps_result`
   - **RetrievalResultDelta**: Used by Vertex Retrieval tools such as Parallel AI, Exa AI, Vertex AI Search, etc. ToolResultDelta.type
   - **is_error** (`boolean`)    Whether the retrieval resulted in an error.

   - **signature** (`string`)    A signature hash for backend validation.

   - **type** (`object`) *(Required)*
     Value: `retrieval_result`
   - **FunctionResultDelta**:
   - **call_id** (`string`) *(Required)*    Required. ID to match the ID from the function call block.

   - **is_error** (`boolean`)

   - **name** (`string`)

   - **result** (`array (ImageContent or TextContent) or object or string`) *(Required)*

   - **type** (`object`) *(Required)*
     Value: `function_result`

     - **event_id** (`string`)  The event_id token to be used to resume the interaction stream, from this event.

     - **event_type** (`object`) *(Required)*
   Value: `step.delta`
     - **index** (`integer`) *(Required)*

     - **metadata** (`StepDeltaMetadata`)  Optional metadata accompanying ANY streamed event.
   - **total_usage** (`Usage`)    Statistics on the interaction request's token usage.
     - **cached_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of cached token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **grounding_tool_count** (`array (GroundingToolCount)`)      Grounding tool count.
       - **count** (`integer`)        The number of grounding tool counts.

       - **type** (`enum (string)`)        The grounding tool type associated with the count.
         Possible values:
         - `google_search`: Grounding with Google Web Search and Image Search, & Web Grounding
for Enterprise.
         - `google_maps`: Grounding with Google Maps.
         - `retrieval`: Grounding with customer's data, for example, VertexAISearch.


     - **input_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of input token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **output_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of output token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **tool_use_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of tool-use token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **total_cached_tokens** (`integer`)      Number of tokens in the cached part of the prompt (the cached content).

     - **total_input_tokens** (`integer`)      Number of tokens in the prompt (context).

     - **total_output_tokens** (`integer`)      Total number of tokens across all the generated responses.

     - **total_thought_tokens** (`integer`)      Number of tokens of thoughts for thinking models.

     - **total_tokens** (`integer`)      Total token count for the interaction request (prompt + responses + other internal tokens).

     - **total_tool_use_tokens** (`integer`)      Number of tokens present in tool-use prompt(s).



    **Examples**
    **Step Delta**


    ```json
    {
  "event_type": "step.delta",
  "index": 0,
  "delta": {
    "type": "text",
    "text": "Hello"
  }
}
    ```
- **StepStop**
    -
     - **event_id** (`string`)  The event_id token to be used to resume the interaction stream, from this event.

     - **event_type** (`object`) *(Required)*
   Value: `step.stop`
     - **index** (`integer`) *(Required)*

     - **metadata** (`StreamMetadata`)  Optional metadata accompanying ANY streamed event.
   - **total_usage** (`Usage`)
     - **cached_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of cached token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **grounding_tool_count** (`array (GroundingToolCount)`)      Grounding tool count.
       - **count** (`integer`)        The number of grounding tool counts.

       - **type** (`enum (string)`)        The grounding tool type associated with the count.
         Possible values:
         - `google_search`: Grounding with Google Web Search and Image Search, & Web Grounding
for Enterprise.
         - `google_maps`: Grounding with Google Maps.
         - `retrieval`: Grounding with customer's data, for example, VertexAISearch.


     - **input_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of input token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **output_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of output token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **tool_use_tokens_by_modality** (`array (ModalityTokens)`)      A breakdown of tool-use token usage by modality.
       - **modality** (`ResponseModality`)        The modality associated with the token count.
         Possible values:
         - `text`: Indicates the model should return text.
         - `image`: Indicates the model should return images.
         - `audio`: Indicates the model should return audio.
         - `video`: Indicates the model should return video.
         - `document`: Indicates the model should return documents.

       - **tokens** (`integer`)        Number of tokens for the modality.


     - **total_cached_tokens** (`integer`)      Number of tokens in the cached part of the prompt (the cached content).

     - **total_input_tokens** (`integer`)      Number of tokens in the prompt (context).

     - **total_output_tokens** (`integer`)      Total number of tokens across all the generated responses.

     - **total_thought_tokens** (`integer`)      Number of tokens of thoughts for thinking models.

     - **total_tokens** (`integer`)      Total token count for the interaction request (prompt + responses + other internal tokens).

     - **total_tool_use_tokens** (`integer`)      Number of tokens present in tool-use prompt(s).



     - **step_usage** (`Usage`)  Model usage stats for this specific step.
   - **cached_tokens_by_modality** (`array (ModalityTokens)`)    A breakdown of cached token usage by modality.
     - **modality** (`ResponseModality`)      The modality associated with the token count.
       Possible values:
       - `text`: Indicates the model should return text.
       - `image`: Indicates the model should return images.
       - `audio`: Indicates the model should return audio.
       - `video`: Indicates the model should return video.
       - `document`: Indicates the model should return documents.

     - **tokens** (`integer`)      Number of tokens for the modality.


   - **grounding_tool_count** (`array (GroundingToolCount)`)    Grounding tool count.
     - **count** (`integer`)      The number of grounding tool counts.

     - **type** (`enum (string)`)      The grounding tool type associated with the count.
       Possible values:
       - `google_search`: Grounding with Google Web Search and Image Search, & Web Grounding
for Enterprise.
       - `google_maps`: Grounding with Google Maps.
       - `retrieval`: Grounding with customer's data, for example, VertexAISearch.


   - **input_tokens_by_modality** (`array (ModalityTokens)`)    A breakdown of input token usage by modality.
     - **modality** (`ResponseModality`)      The modality associated with the token count.
       Possible values:
       - `text`: Indicates the model should return text.
       - `image`: Indicates the model should return images.
       - `audio`: Indicates the model should return audio.
       - `video`: Indicates the model should return video.
       - `document`: Indicates the model should return documents.

     - **tokens** (`integer`)      Number of tokens for the modality.


   - **output_tokens_by_modality** (`array (ModalityTokens)`)    A breakdown of output token usage by modality.
     - **modality** (`ResponseModality`)      The modality associated with the token count.
       Possible values:
       - `text`: Indicates the model should return text.
       - `image`: Indicates the model should return images.
       - `audio`: Indicates the model should return audio.
       - `video`: Indicates the model should return video.
       - `document`: Indicates the model should return documents.

     - **tokens** (`integer`)      Number of tokens for the modality.


   - **tool_use_tokens_by_modality** (`array (ModalityTokens)`)    A breakdown of tool-use token usage by modality.
     - **modality** (`ResponseModality`)      The modality associated with the token count.
       Possible values:
       - `text`: Indicates the model should return text.
       - `image`: Indicates the model should return images.
       - `audio`: Indicates the model should return audio.
       - `video`: Indicates the model should return video.
       - `document`: Indicates the model should return documents.

     - **tokens** (`integer`)      Number of tokens for the modality.


   - **total_cached_tokens** (`integer`)    Number of tokens in the cached part of the prompt (the cached content).

   - **total_input_tokens** (`integer`)    Number of tokens in the prompt (context).

   - **total_output_tokens** (`integer`)    Total number of tokens across all the generated responses.

   - **total_thought_tokens** (`integer`)    Number of tokens of thoughts for thinking models.

   - **total_tokens** (`integer`)    Total token count for the interaction request (prompt + responses + other internal tokens).

   - **total_tool_use_tokens** (`integer`)    Number of tokens present in tool-use prompt(s).


     - **usage** (`Usage`)  Cumulative model usage stats from the start of the session.
   - **cached_tokens_by_modality** (`array (ModalityTokens)`)    A breakdown of cached token usage by modality.
     - **modality** (`ResponseModality`)      The modality associated with the token count.
       Possible values:
       - `text`: Indicates the model should return text.
       - `image`: Indicates the model should return images.
       - `audio`: Indicates the model should return audio.
       - `video`: Indicates the model should return video.
       - `document`: Indicates the model should return documents.

     - **tokens** (`integer`)      Number of tokens for the modality.


   - **grounding_tool_count** (`array (GroundingToolCount)`)    Grounding tool count.
     - **count** (`integer`)      The number of grounding tool counts.

     - **type** (`enum (string)`)      The grounding tool type associated with the count.
       Possible values:
       - `google_search`: Grounding with Google Web Search and Image Search, & Web Grounding
for Enterprise.
       - `google_maps`: Grounding with Google Maps.
       - `retrieval`: Grounding with customer's data, for example, VertexAISearch.


   - **input_tokens_by_modality** (`array (ModalityTokens)`)    A breakdown of input token usage by modality.
     - **modality** (`ResponseModality`)      The modality associated with the token count.
       Possible values:
       - `text`: Indicates the model should return text.
       - `image`: Indicates the model should return images.
       - `audio`: Indicates the model should return audio.
       - `video`: Indicates the model should return video.
       - `document`: Indicates the model should return documents.

     - **tokens** (`integer`)      Number of tokens for the modality.


   - **output_tokens_by_modality** (`array (ModalityTokens)`)    A breakdown of output token usage by modality.
     - **modality** (`ResponseModality`)      The modality associated with the token count.
       Possible values:
       - `text`: Indicates the model should return text.
       - `image`: Indicates the model should return images.
       - `audio`: Indicates the model should return audio.
       - `video`: Indicates the model should return video.
       - `document`: Indicates the model should return documents.

     - **tokens** (`integer`)      Number of tokens for the modality.


   - **tool_use_tokens_by_modality** (`array (ModalityTokens)`)    A breakdown of tool-use token usage by modality.
     - **modality** (`ResponseModality`)      The modality associated with the token count.
       Possible values:
       - `text`: Indicates the model should return text.
       - `image`: Indicates the model should return images.
       - `audio`: Indicates the model should return audio.
       - `video`: Indicates the model should return video.
       - `document`: Indicates the model should return documents.

     - **tokens** (`integer`)      Number of tokens for the modality.


   - **total_cached_tokens** (`integer`)    Number of tokens in the cached part of the prompt (the cached content).

   - **total_input_tokens** (`integer`)    Number of tokens in the prompt (context).

   - **total_output_tokens** (`integer`)    Total number of tokens across all the generated responses.

   - **total_thought_tokens** (`integer`)    Number of tokens of thoughts for thinking models.

   - **total_tokens** (`integer`)    Total token count for the interaction request (prompt + responses + other internal tokens).

   - **total_tool_use_tokens** (`integer`)    Number of tokens present in tool-use prompt(s).


    **Examples**
    **Step Stop**


    ```json
    {
  "event_type": "step.stop",
  "index": 0
}
    ```

**JSON Representation:**
```json
{
  "event_id": "string",
  "event_type": {},
  "interaction": {
    "agent": "string",
    "created": "string",
    "id": "string",
    "model": "string",
    "object": "string",
    "service_tier": "flex",
    "status": "in_progress",
    "steps": [
      {
        "content": [
          "..."
        ],
        "type": {}
      }
    ],
    "updated": "string",
    "usage": {
      "cached_tokens_by_modality": [
        {
          "modality": "text",
          "tokens": 0
        }
      ],
      "grounding_tool_count": [
        {
          "count": 0,
          "type": "google_search"
        }
      ],
      "input_tokens_by_modality": [
        {
          "modality": "text",
          "tokens": 0
        }
      ],
      "output_tokens_by_modality": [
        {
          "modality": "text",
          "tokens": 0
        }
      ],
      "tool_use_tokens_by_modality": [
        {
          "modality": "text",
          "tokens": 0
        }
      ],
      "total_cached_tokens": 0,
      "total_input_tokens": 0,
      "total_output_tokens": 0,
      "total_thought_tokens": 0,
      "total_tokens": 0,
      "total_tool_use_tokens": 0
    }
  },
  "metadata": {
    "total_usage": {
      "cached_tokens_by_modality": [
        {
          "modality": "text",
          "tokens": 0
        }
      ],
      "grounding_tool_count": [
        {
          "count": 0,
          "type": "google_search"
        }
      ],
      "input_tokens_by_modality": [
        {
          "modality": "text",
          "tokens": 0
        }
      ],
      "output_tokens_by_modality": [
        {
          "modality": "text",
          "tokens": 0
        }
      ],
      "tool_use_tokens_by_modality": [
        {
          "modality": "text",
          "tokens": 0
        }
      ],
      "total_cached_tokens": 0,
      "total_input_tokens": 0,
      "total_output_tokens": 0,
      "total_thought_tokens": 0,
      "total_tokens": 0,
      "total_tool_use_tokens": 0
    }
  }
}
```


### ResponseFormat { #Resource:ResponseFormat }


**Polymorphic Types:** - **AudioResponseFormat**
    - Configuration for audio output format.
     - **bit_rate** (`integer`)  Bit rate in bits per second (bps). Only applicable for compressed formats (MP3, Opus).

     - **delivery** (`enum (string)`)  The delivery mode for the audio output.
   Possible values:
   - `inline`: Audio data is returned inline in the response.
   - `uri`: Audio data is returned as a URI.

     - **mime_type** (`enum (string)`)  The MIME type of the audio output.
   Possible values:
   - `audio/mp3`: MP3 audio format.
   - `audio/ogg_opus`: OGG Opus audio format.
   - `audio/l16`: Raw PCM (L16) audio format.
   - `audio/wav`: WAV audio format.
   - `audio/alaw`: A-law audio format.
   - `audio/mulaw`: Mu-law audio format.

     - **sample_rate** (`integer`)  Sample rate in Hz.

     - **type** (`object`) *(Required)*
   Value: `audio`
    **Examples**
    **Audio Output**


    ```json
    {
  "type": "audio",
  "sample_rate": 24000
}
    ```
- **TextResponseFormat**
    - Configuration for text output format.
     - **mime_type** (`enum (string)`)  The MIME type of the text output.
   Possible values:
   - `application/json`: JSON output format.
   - `text/plain`: Plain text output format.

     - **schema** (`object`)  The JSON schema that the output should conform to. Only applicable when mime_type is application/json.

     - **type** (`object`) *(Required)*
   Value: `text`
    **Examples**
    **Text Output (JSON Schema)**


    ```json
    {
  "type": "text",
  "mime_type": "application/json",
  "schema": {
    "type": "object",
    "properties": {
      "ingredients": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "recipe_name": {
        "type": "string"
      }
    },
    "required": [
      "ingredients",
      "recipe_name"
    ]
  }
}
    ```
- **ImageResponseFormat**
    - Configuration for image output format.
     - **aspect_ratio** (`enum (string)`)  The aspect ratio for the image output.
   Possible values:
   - `1:1`: 1:1 aspect ratio.
   - `2:3`: 2:3 aspect ratio.
   - `3:2`: 3:2 aspect ratio.
   - `3:4`: 3:4 aspect ratio.
   - `4:3`: 4:3 aspect ratio.
   - `4:5`: 4:5 aspect ratio.
   - `5:4`: 5:4 aspect ratio.
   - `9:16`: 9:16 aspect ratio.
   - `16:9`: 16:9 aspect ratio.
   - `21:9`: 21:9 aspect ratio.
   - `1:8`: 1:8 aspect ratio.
   - `8:1`: 8:1 aspect ratio.
   - `1:4`: 1:4 aspect ratio.
   - `4:1`: 4:1 aspect ratio.

     - **delivery** (`enum (string)`)  The delivery mode for the image output.
   Possible values:
   - `inline`: Image data is returned inline in the response.
   - `uri`: Image data is returned as a URI.

     - **image_size** (`enum (string)`)  The size of the image output.
   Possible values:
   - `512`: 512px image size.
   - `1K`: 1K image size.
   - `2K`: 2K image size.
   - `4K`: 4K image size.

     - **mime_type** (`enum (string)`)  The MIME type of the image output.
   Possible values:
   - `image/jpeg`: JPEG image format.

     - **type** (`object`) *(Required)*
   Value: `image`
    **Examples**
    **Image Output**


    ```json
    {
  "type": "image",
  "mime_type": "image/jpeg",
  "aspect_ratio": "16:9",
  "image_size": "1K"
}
    ```
- **VideoResponseFormat**
    - Configuration for video output format.
     - **aspect_ratio** (`enum (string)`)  The aspect ratio for the video output.
   Possible values:
   - `16:9`: 16:9 aspect ratio.
   - `9:16`: 9:16 aspect ratio.

     - **delivery** (`enum (string)`)  The delivery mode for the video output.
   Possible values:
   - `inline`: Video data is returned inline in the response.
   - `uri`: Video data is returned as a URI.

     - **duration** (`string`)  The duration for the video output.

     - **gcs_uri** (`string`)  The GCS URI to store the video output. Required for Vertex if delivery mode is URI.

     - **type** (`object`) *(Required)*
   Value: `video`
    **Examples**
    **Video Output**


    ```json
    {
  "type": "video",
  "delivery": "inline",
  "aspect_ratio": "16:9"
}
    ```

**JSON Representation:**
```json
{
  "bit_rate": 0,
  "delivery": "inline",
  "mime_type": "audio/mp3",
  "sample_rate": 0,
  "type": {}
}
```


### Step { #Resource:Step }
A step in the interaction.

**Polymorphic Types:** (Discriminator: `type`)- **UserInputStep**
    - Input provided by the user.
     - **content** (`array (Content)`)

     - **type** (`object`) *(Required)*
   Value: `user_input`
    **Examples**
    **UserInputStep**


    ```json
    {
  "type": "user_input",
  "content": [
    {
      "type": "text",
      "text": "What is the capital of France?"
    }
  ]
}
    ```
- **ModelOutputStep**
    - Output generated by the model.
     - **content** (`array (Content)`)

     - **error** (`Status`)  The error result of the operation in case of failure or cancellation.
   - **code** (`integer`)    The status code, which should be an enum value of google.rpc.Code.

   - **details** (`array (object)`)    A list of messages that carry the error details.  There is a common set of message types for APIs to use.

   - **message** (`string`)    A developer-facing error message, which should be in English. Any user-facing error message should be localized and sent in the google.rpc.Status.details field, or localized by the client.


     - **type** (`object`) *(Required)*
   Value: `model_output`
    **Examples**
    **ModelOutputStep**


    ```json
    {
  "type": "model_output",
  "content": [
    {
      "type": "text",
      "text": "The capital of France is Paris."
    }
  ]
}
    ```
- **ThoughtStep**
    - A thought step.
     - **signature** (`string`)  A signature hash for backend validation.

     - **summary** (`array (ThoughtSummaryContent)`)  A summary of the thought.
   **Possible Types:** (Discriminator: `type`)
   - **TextContent**: A text content block.
   - **annotations** (`array (Annotation)`)    Citation information for model-generated content.
     **Possible Types:** (Discriminator: `type`)
     - **UrlCitation**: A URL citation annotation.
     - **end_index** (`integer`)      End of the attributed segment, exclusive.

     - **start_index** (`integer`)      Start of segment of the response that is attributed to this source.  Index indicates the start of the segment, measured in bytes.

     - **title** (`string`)      The title of the URL.

     - **type** (`object`) *(Required)*
       Value: `url_citation`
     - **url** (`string`)      The URL.

     - **FileCitation**: A file citation annotation.
     - **custom_metadata** (`object`)      User provided metadata about the retrieved context.

     - **document_uri** (`string`)      The URI of the file.

     - **end_index** (`integer`)      End of the attributed segment, exclusive.

     - **file_name** (`string`)      The name of the file.

     - **media_id** (`string`)      Media ID in-case of image citations, if applicable.

     - **page_number** (`integer`)      Page number of the cited document, if applicable.

     - **source** (`string`)      Source attributed for a portion of the text.

     - **start_index** (`integer`)      Start of segment of the response that is attributed to this source.  Index indicates the start of the segment, measured in bytes.

     - **type** (`object`) *(Required)*
       Value: `file_citation`
     - **PlaceCitation**: A place citation annotation.
     - **end_index** (`integer`)      End of the attributed segment, exclusive.

     - **name** (`string`)      Title of the place.

     - **place_id** (`string`)      The ID of the place, in `places/{place_id}` format.

     - **review_snippets** (`array (ReviewSnippet)`)      Snippets of reviews that are used to generate answers about the features of a given place in Google Maps.
       - **review_id** (`string`)        The ID of the review snippet.

       - **title** (`string`)        Title of the review.

       - **url** (`string`)        A link that corresponds to the user review on Google Maps.


     - **start_index** (`integer`)      Start of segment of the response that is attributed to this source.  Index indicates the start of the segment, measured in bytes.

     - **type** (`object`) *(Required)*
       Value: `place_citation`
     - **url** (`string`)      URI reference of the place.


   - **text** (`string`) *(Required)*    Required. The text content.

   - **type** (`object`) *(Required)*
     Value: `text`
   - **ImageContent**: An image content block.
   - **data** (`string`)    The image content.

   - **mime_type** (`enum (string)`)    The mime type of the image.
     Possible values:
     - `image/png`: PNG image format
     - `image/jpeg`: JPEG image format
     - `image/webp`: WebP image format
     - `image/heic`: HEIC image format
     - `image/heif`: HEIF image format
     - `image/gif`: GIF image format
     - `image/bmp`: BMP image format
     - `image/tiff`: TIFF image format

   - **resolution** (`MediaResolution`)    The resolution of the media.
     Possible values:
     - `low`: Low resolution.
     - `medium`: Medium resolution.
     - `high`: High resolution.
     - `ultra_high`: Ultra high resolution.

   - **type** (`object`) *(Required)*
     Value: `image`
   - **uri** (`string`)    The URI of the image.


     - **type** (`object`) *(Required)*
   Value: `thought`
    **Examples**
    **ThoughtStep**


    ```json
    {
  "type": "thought",
  "signature": "thought_sig_abcd1234",
  "summary": [
    {
      "type": "text",
      "text": "The model is searching Google for the capital of France."
    }
  ]
}
    ```
- **FunctionCallStep**
    - A function tool call step.
     - **arguments** (`object`) *(Required)*  Required. The arguments to pass to the function.

     - **id** (`string`) *(Required)*  Required. A unique ID for this specific tool call.

     - **name** (`string`) *(Required)*  Required. The name of the tool to call.

     - **type** (`object`) *(Required)*
   Value: `function_call`
    **Examples**
    **FunctionCallStep**


    ```json
    {
  "type": "function_call",
  "id": "call_98231",
  "name": "get_weather",
  "arguments": {
    "location": "Boston, MA"
  }
}
    ```
- **CodeExecutionCallStep**
    - Code execution call step.
     - **arguments** (`CodeExecutionCallStepArguments`) *(Required)*  Required. The arguments to pass to the code execution.
   - **code** (`string`)    The code to be executed.

   - **language** (`enum (string)`)    Programming language of the `code`.
     Possible values:
     - `python`: Python >= 3.10, with numpy and simpy available.


     - **id** (`string`) *(Required)*  Required. A unique ID for this specific tool call.

     - **signature** (`string`)  A signature hash for backend validation.

     - **type** (`object`) *(Required)*
   Value: `code_execution_call`
    **Examples**
    **CodeExecutionCallStep**


    ```json
    {
  "type": "code_execution_call",
  "id": "code_call_71021",
  "arguments": {
    "code": "print(sum(range(1, 11)))"
  }
}
    ```
- **UrlContextCallStep**
    - URL context call step.
     - **arguments** (`UrlContextCallArguments`) *(Required)*  Required. The arguments to pass to the URL context.
   - **urls** (`array (string)`)    The URLs to fetch.


     - **id** (`string`) *(Required)*  Required. A unique ID for this specific tool call.

     - **signature** (`string`)  A signature hash for backend validation.

     - **type** (`object`) *(Required)*
   Value: `url_context_call`
    **Examples**
    **UrlContextCallStep**


    ```json
    {
  "type": "url_context_call",
  "id": "url_call_10219",
  "arguments": {
    "urls": [
      "https://www.example.com"
    ]
  }
}
    ```
- **McpServerToolCallStep**
    - MCPServer tool call step.
     - **arguments** (`object`) *(Required)*  Required. The JSON object of arguments for the function.

     - **id** (`string`) *(Required)*  Required. A unique ID for this specific tool call.

     - **name** (`string`) *(Required)*  Required. The name of the tool which was called.

     - **server_name** (`string`) *(Required)*  Required. The name of the used MCP server.

     - **type** (`object`) *(Required)*
   Value: `mcp_server_tool_call`
    **Examples**
    **McpServerToolCallStep**


    ```json
    {
  "type": "mcp_server_tool_call",
  "id": "mcp_call_29012",
  "name": "calculate_tax",
  "server_name": "financial_mcp_server",
  "arguments": {
    "income": 120000,
    "state": "CA"
  }
}
    ```
- **GoogleSearchCallStep**
    - Google Search call step.
     - **arguments** (`GoogleSearchCallStepArguments`) *(Required)*  Required. The arguments to pass to Google Search.
   - **queries** (`array (string)`)    Web search queries for the following-up web search.


     - **id** (`string`) *(Required)*  Required. A unique ID for this specific tool call.

     - **search_type** (`enum (string)`)  The type of search grounding enabled.
   Possible values:
   - `web_search`: Setting this field enables web search. Only text results are returned.
   - `image_search`: Setting this field enables image search. Image bytes are returned.
   - `enterprise_web_search`: Setting this field enables enterprise web search.

     - **signature** (`string`)  A signature hash for backend validation.

     - **type** (`object`) *(Required)*
   Value: `google_search_call`
    **Examples**
    **GoogleSearchCallStep**


    ```json
    {
  "type": "google_search_call",
  "id": "search_call_19201",
  "arguments": {
    "query": "Who won the men's 100m in Paris 2024?"
  }
}
    ```
- **FileSearchCallStep**
    - File Search call step.
     - **id** (`string`) *(Required)*  Required. A unique ID for this specific tool call.

     - **signature** (`string`)  A signature hash for backend validation.

     - **type** (`object`) *(Required)*
   Value: `file_search_call`
    **Examples**
    **FileSearchCallStep**


    ```json
    {
  "type": "file_search_call",
  "id": "file_call_88192"
}
    ```
- **GoogleMapsCallStep**
    - Google Maps call step.
     - **arguments** (`GoogleMapsCallStepArguments`)  The arguments to pass to the Google Maps tool.
   - **queries** (`array (string)`)    The queries to be executed.


     - **id** (`string`) *(Required)*  Required. A unique ID for this specific tool call.

     - **signature** (`string`)  A signature hash for backend validation.

     - **type** (`object`) *(Required)*
   Value: `google_maps_call`
    **Examples**
    **GoogleMapsCallStep**


    ```json
    {
  "type": "google_maps_call",
  "id": "maps_call_39201",
  "arguments": {
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
    ```
- **FunctionResultStep**
    - Result of a function tool call.
     - **call_id** (`string`) *(Required)*  Required. ID to match the ID from the function call block.

     - **is_error** (`boolean`)  Whether the tool call resulted in an error.

     - **name** (`string`)  The name of the tool that was called.

     - **result** (`array (ImageContent or TextContent) or object or string`) *(Required)*  The result of the tool call.

     - **type** (`object`) *(Required)*
   Value: `function_result`
    **Examples**
    **FunctionResultStep**


    ```json
    {
  "type": "function_result",
  "call_id": "call_98231",
  "name": "get_weather",
  "result": [
    {
      "type": "text",
      "text": "{\"weather\":\"sunny\"}"
    }
  ]
}
    ```
- **CodeExecutionResultStep**
    - Code execution result step.
     - **call_id** (`string`) *(Required)*  Required. ID to match the ID from the function call block.

     - **is_error** (`boolean`)  Whether the code execution resulted in an error.

     - **result** (`string`) *(Required)*  Required. The output of the code execution.

     - **signature** (`string`)  A signature hash for backend validation.

     - **type** (`object`) *(Required)*
   Value: `code_execution_result`
    **Examples**
    **CodeExecutionResultStep**


    ```json
    {
  "type": "code_execution_result",
  "call_id": "code_call_71021",
  "result": "55\n"
}
    ```
- **UrlContextResultStep**
    - URL context result step.
     - **call_id** (`string`) *(Required)*  Required. ID to match the ID from the function call block.

     - **is_error** (`boolean`)  Whether the URL context resulted in an error.

     - **result** (`array (UrlContextResult)`) *(Required)*  Required. The results of the URL context.
   - **status** (`enum (string)`)    The status of the URL retrieval.
     Possible values:
     - `success`: Url retrieval is successful.
     - `error`: Url retrieval is failed due to error.
     - `paywall`: Url retrieval is failed because the content is behind paywall.
     - `unsafe`: Url retrieval is failed because the content is unsafe.

   - **url** (`string`)    The URL that was fetched.


     - **signature** (`string`)  A signature hash for backend validation.

     - **type** (`object`) *(Required)*
   Value: `url_context_result`
    **Examples**
    **UrlContextResultStep**


    ```json
    {
  "type": "url_context_result",
  "call_id": "url_call_10219",
  "result": [
    {
      "url": "https://www.example.com",
      "title": "Example Domain",
      "snippet": "This domain is for use in illustrative examples in documents."
    }
  ]
}
    ```
- **GoogleSearchResultStep**
    - Google Search result step.
     - **call_id** (`string`) *(Required)*  Required. ID to match the ID from the function call block.

     - **is_error** (`boolean`)  Whether the Google Search resulted in an error.

     - **result** (`array (GoogleSearchResultItem)`) *(Required)*  Required. The results of the Google Search.
   - **search_suggestions** (`string`)    Web content snippet that can be embedded in a web page or an app webview.


     - **signature** (`string`)  A signature hash for backend validation.

     - **type** (`object`) *(Required)*
   Value: `google_search_result`
    **Examples**
    **GoogleSearchResultStep**


    ```json
    {
  "type": "google_search_result",
  "call_id": "search_call_19201",
  "result": [
    {
      "title": "Paris 2024 Olympics: Noah Lyles wins men's 100m gold",
      "url": "https://olympics.com/en/news/paris-2024-noah-lyles-wins-mens-100m-gold",
      "snippet": "American Noah Lyles won the Olympic men's 100m gold medal in a photo finish."
    }
  ]
}
    ```
- **McpServerToolResultStep**
    - MCPServer tool result step.
     - **call_id** (`string`) *(Required)*  Required. ID to match the ID from the function call block.

     - **name** (`string`)  Name of the tool which is called for this specific tool call.

     - **result** (`array (ImageContent or TextContent) or object or string`) *(Required)*  The output from the MCP server call. Can be simple text or rich content.

     - **server_name** (`string`)  The name of the used MCP server.

     - **type** (`object`) *(Required)*
   Value: `mcp_server_tool_result`
    **Examples**
    **McpServerToolResultStep**


    ```json
    {
  "type": "mcp_server_tool_result",
  "call_id": "mcp_call_29012",
  "result": {
    "tax_due": 32400
  }
}
    ```
- **FileSearchResultStep**
    - File Search result step.
     - **call_id** (`string`) *(Required)*  Required. ID to match the ID from the function call block.

     - **signature** (`string`)  A signature hash for backend validation.

     - **type** (`object`) *(Required)*
   Value: `file_search_result`
    **Examples**
    **FileSearchResultStep**


    ```json
    {
  "type": "file_search_result",
  "call_id": "file_call_88192"
}
    ```
- **GoogleMapsResultStep**
    - Google Maps result step.
     - **call_id** (`string`) *(Required)*  Required. ID to match the ID from the function call block.

     - **result** (`array (GoogleMapsResultItem)`) *(Required)*
   - **places** (`array (GoogleMapsResultPlaces)`)
     - **name** (`string`)

     - **place_id** (`string`)

     - **review_snippets** (`array (ReviewSnippet)`)
       - **review_id** (`string`)        The ID of the review snippet.

       - **title** (`string`)        Title of the review.

       - **url** (`string`)        A link that corresponds to the user review on Google Maps.


     - **url** (`string`)


   - **widget_context_token** (`string`)


     - **signature** (`string`)  A signature hash for backend validation.

     - **type** (`object`) *(Required)*
   Value: `google_maps_result`
    **Examples**
    **GoogleMapsResultStep**


    ```json
    {
  "type": "google_maps_result",
  "call_id": "maps_call_39201",
  "result": [
    {
      "place_id": "ChIJIQBpAG2ahYAR9R7bNdTLg8M",
      "name": "Golden Gate Park",
      "rating": 4.8
    }
  ]
}
    ```

**JSON Representation:**
```json
{
  "content": [
    {
      "annotations": [
        {
          "end_index": 0,
          "start_index": 0,
          "title": "string",
          "type": {},
          "url": "string"
        }
      ],
      "text": "string",
      "type": {}
    }
  ],
  "type": {}
}
```


### EnvironmentConfig { #Resource:EnvironmentConfig }
Configuration for a custom environment.

**Properties:**
- **environment_id** (`string`) Optional. The environment ID for the interaction. If specified, the request will update the existing environment instead of creating a new one.

- **network** (`EnvironmentNetworkEgressAllowlist or enum (string)`) Network configuration for the environment.
  Possible values:
  - `disabled`: Turns all network off.

- **sources** (`array (Source)`)
  - **content** (`string`)   The inline content if `type` is `INLINE`.

  - **encoding** (`string`)   Optional encoding for inline content (e.g. `base64`).

  - **source** (`string`)   The source of the environment. For GCS, this is the GCS path. For GitHub, this is the GitHub path.

  - **target** (`string`)   Where the source should appear in the environment.

  - **type** (`enum (string)`)
    Possible values:
    - `gcs`: A GCS bucket.
    - `inline`: Inline content.
    - `repository`: A generic repository. The protocol prefix in the source URL
identifies the provider (e.g., github://, gcs://).
    - `skill_registry`: A skill resource from the Skill Registry Service.
Skill: projects/{project}/locations/{location}/skills/{skill}
SkillRevision:
projects/{project}/locations/{location}/skills/{skill}/revisions/{revision}
Support mounting all skills under a project:
projects/{project}/locations/{location}/skills.


- **type** (`object`) *(Required)*
  Value: `remote`

**JSON Representation:**
```json
{
  "environment_id": "string",
  "network": {
    "allowlist": [
      {
        "domain": "github.com",
        "transform": [
          {
            "Authorization": "Bearer your-token"
          }
        ]
      },
      {
        "domain": "*.googleapis.com"
      }
    ]
  },
  "sources": [
    {
      "content": "string",
      "encoding": "string",
      "source": "string",
      "target": "string",
      "type": "gcs"
    }
  ],
  "type": {}
}
```

**Examples**
**Inline Sources**

```json
{
  "type": "remote",
  "sources": [
    {
      "type": "inline",
      "target": ".agents/AGENTS.md",
      "content": "You are a data analyst. Always include visualizations and export results as PDF."
    },
    {
      "type": "inline",
      "target": ".agents/skills/slide-maker/SKILL.md",
      "content": "---\nname: slide-maker\ndescription: Create HTML slide decks\n---\n# Slide Maker\n\nWhen asked to create a presentation:\n1. Analyze the input data\n2. Create an HTML slide deck with reveal.js\n3. Save to /workspace/output/slides.html"
    }
  ]
}
```
**External Sources**

```json
{
  "type": "remote",
  "sources": [
    {
      "type": "repository",
      "source": "https://github.com/my-org/my-skills.git",
      "target": ".agents/skills"
    },
    {
      "type": "gcs",
      "source": "gs://my-bucket/my-folder",
      "target": "/workspace/data"
    }
  ]
}
```
**Network Allowlist**

```json
{
  "type": "remote",
  "network": {
    "allowlist": [
      {
        "domain": "pypi.org"
      },
      {
        "domain": "*.github.com"
      }
    ]
  }
}
```
**Proxy Credentials**

```json
{
  "type": "remote",
  "network": {
    "allowlist": [
      {
        "domain": "api.github.com",
        "transform": {
          "Authorization": "Bearer YOUR_GITHUB_TOKEN"
        }
      }
    ]
  }
}
```

### EnvironmentNetworkEgressAllowlist { #Resource:EnvironmentNetworkEgressAllowlist }
Outbound networking configuration for the sandbox. Accepts an object with an 'allowlist' array to restrict traffic, or the string 'disabled' to turn off all network access. Omit entirely to allow all outbound traffic with no header injection.


**JSON Representation:**
```json
{
  "allowlist": [
    {
      "domain": "github.com",
      "transform": [
        {
          "Authorization": "Bearer your-token"
        }
      ]
    },
    {
      "domain": "*.googleapis.com"
    }
  ]
}
```

**Examples**
**Example**

```json
{
  "allowlist": [
    {
      "domain": "github.com",
      "transform": [
        {
          "Authorization": "Bearer your-token"
        }
      ]
    },
    {
      "domain": "*.googleapis.com"
    }
  ]
}
```

### ToolChoiceConfig { #Resource:ToolChoiceConfig }
The tool choice configuration containing allowed tools.

**Properties:**
- **allowed_tools** (`AllowedTools`) The allowed tools.
  - **mode** (`enum (string)`)   The mode of the tool choice.
    Possible values:
    - `auto`: Auto tool choice.
    - `any`: Any tool choice.
    - `none`: No tool choice.
    - `validated`: Validated tool choice.

  - **tools** (`array (string)`)   The names of the allowed tools.



**JSON Representation:**
```json
{
  "allowed_tools": {
    "mode": "any",
    "tools": [
      "my_tool"
    ]
  }
}
```

**Examples**
**Example**

```json
{
  "allowed_tools": {
    "mode": "any",
    "tools": [
      "my_tool"
    ]
  }
}
```

### ImageContent { #Resource:ImageContent }
An image content block.

**Properties:**
- **data** (`string`) The image content.

- **mime_type** (`enum (string)`) The mime type of the image.
  Possible values:
  - `image/png`: PNG image format
  - `image/jpeg`: JPEG image format
  - `image/webp`: WebP image format
  - `image/heic`: HEIC image format
  - `image/heif`: HEIF image format
  - `image/gif`: GIF image format
  - `image/bmp`: BMP image format
  - `image/tiff`: TIFF image format

- **resolution** (`MediaResolution`) The resolution of the media.
  Possible values:
  - `low`: Low resolution.
  - `medium`: Medium resolution.
  - `high`: High resolution.
  - `ultra_high`: Ultra high resolution.

- **type** (`object`) *(Required)*
  Value: `image`
- **uri** (`string`) The URI of the image.


**JSON Representation:**
```json
{
  "data": "string",
  "mime_type": "image/png",
  "resolution": "low",
  "type": {},
  "uri": "string"
}
```

**Examples**
**Image**

```json
{
  "type": "image",
  "data": "BASE64_ENCODED_IMAGE",
  "mime_type": "image/png"
}
```

### TextContent { #Resource:TextContent }
A text content block.

**Properties:**
- **annotations** (`array (Annotation)`) Citation information for model-generated content.
  **Possible Types:** (Discriminator: `type`)
  - **UrlCitation**: A URL citation annotation.
  - **end_index** (`integer`)   End of the attributed segment, exclusive.

  - **start_index** (`integer`)   Start of segment of the response that is attributed to this source.  Index indicates the start of the segment, measured in bytes.

  - **title** (`string`)   The title of the URL.

  - **type** (`object`) *(Required)*
    Value: `url_citation`
  - **url** (`string`)   The URL.

  - **FileCitation**: A file citation annotation.
  - **custom_metadata** (`object`)   User provided metadata about the retrieved context.

  - **document_uri** (`string`)   The URI of the file.

  - **end_index** (`integer`)   End of the attributed segment, exclusive.

  - **file_name** (`string`)   The name of the file.

  - **media_id** (`string`)   Media ID in-case of image citations, if applicable.

  - **page_number** (`integer`)   Page number of the cited document, if applicable.

  - **source** (`string`)   Source attributed for a portion of the text.

  - **start_index** (`integer`)   Start of segment of the response that is attributed to this source.  Index indicates the start of the segment, measured in bytes.

  - **type** (`object`) *(Required)*
    Value: `file_citation`
  - **PlaceCitation**: A place citation annotation.
  - **end_index** (`integer`)   End of the attributed segment, exclusive.

  - **name** (`string`)   Title of the place.

  - **place_id** (`string`)   The ID of the place, in `places/{place_id}` format.

  - **review_snippets** (`array (ReviewSnippet)`)   Snippets of reviews that are used to generate answers about the features of a given place in Google Maps.
    - **review_id** (`string`)     The ID of the review snippet.

    - **title** (`string`)     Title of the review.

    - **url** (`string`)     A link that corresponds to the user review on Google Maps.


  - **start_index** (`integer`)   Start of segment of the response that is attributed to this source.  Index indicates the start of the segment, measured in bytes.

  - **type** (`object`) *(Required)*
    Value: `place_citation`
  - **url** (`string`)   URI reference of the place.


- **text** (`string`) *(Required)* Required. The text content.

- **type** (`object`) *(Required)*
  Value: `text`

**JSON Representation:**
```json
{
  "annotations": [
    {
      "end_index": 0,
      "start_index": 0,
      "title": "string",
      "type": {},
      "url": "string"
    }
  ],
  "text": "string",
  "type": {}
}
```

**Examples**
**Text**

```json
{
  "type": "text",
  "text": "Hello, how are you?"
}
```

