# Gemini Interactions API

> **Recommended:** The **Interactions API** is the recommended standard API for all new projects and applications using Gemini. It is optimized for agentic workflows, server-side state management, and real-time conversations.

The Gemini Interactions API allows developers to build generative AI applications using Gemini models. Gemini is our most capable model, built from the ground up to be multimodal. It can generalize and seamlessly understand, operate across, and combine different types of information including language, images, audio, video, and code. You can use the Gemini API for use cases like reasoning across text and images, content generation, dialogue agents, summarization and classification systems, and more.

## Interactions

### Creating an interaction

`POST https://generativelanguage.googleapis.com/v1/interactions`

Creates a new interaction.

#### Parameters
- **api_version** (`string`) *(Required)* Which version of the API to use.


#### Request Body
- **model** (`ModelOption`) The name of the `Model` used for generating the interaction. <br><strong>Required if `agent` is not provided.</strong>
  Possible values:
  - `models/gemini-2.5-flash-lite`: Our smallest and most cost effective model, built for at scale usage.
  - `models/gemini-2.5-flash-image`: Our native image generation model, optimized for speed, flexibility, and contextual understanding. Text input and output is priced the same as 2.5 Flash.
  - `models/gemini-3.1-flash-lite`: Our most cost-efficient model, optimized for high-volume agentic tasks, translation, and simple data processing.
  - `models/gemini-3.1-flash-image`: Pro-level visual intelligence with Flash-speed efficiency and reality-grounded generation capabilities.
  - `models/gemini-3.5-flash`: Our most intelligent model for sustained frontier performance in agentic and coding tasks.

- **agent** (`AgentOption`) The name of the `Agent` used for generating the interaction. <br><strong>Required if `model` is not provided.</strong>
  Possible values:
  - `deep-research-pro-preview-12-2025`: Gemini Deep Research Agent
  - `deep-research-preview-04-2026`: Gemini Deep Research Agent
  - `deep-research-max-preview-04-2026`: Gemini Deep Research Max Agent
  - `antigravity-preview-05-2026`: Use the Antigravity managed agent to perform multi-step tasks that require reasoning, file operations, and tool use.

- **input** (`Content or array (Content) or array (Step) or string`) *(Required)* The inputs for the interaction (common to both Model and Agent).

- **system_instruction** (`string`) System instruction for the interaction.

- **tools** (`array (Tool)`) A list of tool declarations the model may call during interaction.

- **response_format** (`ResponseFormat or array (ResponseFormat)`) Enforces that the generated response is a JSON object that complies with the JSON schema specified in this field.

- **stream** (`boolean`) Input only. Whether the interaction will be streamed.

- **store** (`boolean`) Input only. Whether to store the response and request for later retrieval.

- **background** (`boolean`) Input only. Whether to run the model interaction in the background.

- **generation_config** (`GenerationConfig`) <strong>Model Configuration</strong><br>Configuration parameters for the model interaction. <br><em>Alternative to `agent_config`. Only applicable when `model` is set.</em>
  - **max_output_tokens** (`integer`)   The maximum number of tokens to include in the response.

  - **seed** (`integer`)   Seed used in decoding for reproducibility.

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


- **agent_config** (`DynamicAgentConfig`) <strong>Agent Configuration</strong><br>Configuration for the agent. <br><em>Alternative to `generation_config`. Only applicable when `agent` is set.</em>
  - **type** (`object`) *(Required)*
    Value: `dynamic`


- **labels** (`object`) The labels with user-defined metadata for the request.

- **previous_interaction_id** (`string`) The ID of the previous interaction, if any.

- **safety_settings** (`array (SafetySetting)`) Safety settings for the interaction.


#### Response
Returns [Interaction](#interaction) resources.

#### Examples
**Simple Request**

**REST**

```sh
curl -X POST https://generativelanguage.googleapis.com/v1/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
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
curl -X POST https://generativelanguage.googleapis.com/v1/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
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
curl -X POST https://generativelanguage.googleapis.com/v1/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
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
curl -X POST https://generativelanguage.googleapis.com/v1/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
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
---
### Canceling an interaction

`POST https://generativelanguage.googleapis.com/v1/interactions/{id}/cancel`

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

curl -X POST "https://generativelanguage.googleapis.com/v1/interactions/$INTERACTION_ID/cancel" \
  -H "x-goog-api-key: $GEMINI_API_KEY"
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
  "id": "v1_ChdPU0F4YWFtNkFwS2kxZThQZ05lbXdROBIXT1NBeGFhbTZBcEtpMWU4UGdOZW13UTg",
  "model": "gemini-3.5-flash",
  "status": "cancelled",
  "object": "interaction",
  "created": "2025-11-26T12:25:15Z",
  "updated": "2025-11-26T12:25:15Z"
}
```
---
### Retrieving an interaction

`GET https://generativelanguage.googleapis.com/v1/interactions/{id}`

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

curl -X GET "https://generativelanguage.googleapis.com/v1/interactions/$INTERACTION_ID" \
  -H "x-goog-api-key: $GEMINI_API_KEY"
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

`DELETE https://generativelanguage.googleapis.com/v1/interactions/{id}`

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

curl -X DELETE "https://generativelanguage.googleapis.com/v1/interactions/$INTERACTION_ID" \
  -H "x-goog-api-key: $GEMINI_API_KEY"
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

- **agent_config** (`DynamicAgentConfig`) Configuration parameters for the agent interaction.
  - **type** (`object`) *(Required)*
    Value: `dynamic`

- **created** (`string`) Output only. The time at which the response was created in ISO 8601 format (YYYY-MM-DDThh:mm:ssZ).

- **generation_config** (`GenerationConfig`) Input only. Configuration parameters for the model interaction.
  - **max_output_tokens** (`integer`)   The maximum number of tokens to include in the response.

  - **seed** (`integer`)   Seed used in decoding for reproducibility.

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


- **id** (`string`) Required. Output only. A unique identifier for the interaction completion.
  Default: ``
- **input** (`Content or array (Content) or array (Step) or string`) The input for the interaction.

- **labels** (`object`) The labels with user-defined metadata for the request.

- **model** (`ModelOption`) The name of the `Model` used for generating the interaction.
  Possible values:
  - `models/gemini-2.5-flash-lite`: Our smallest and most cost effective model, built for at scale usage.
  - `models/gemini-2.5-flash-image`: Our native image generation model, optimized for speed, flexibility, and contextual understanding. Text input and output is priced the same as 2.5 Flash.
  - `models/gemini-3.1-flash-lite`: Our most cost-efficient model, optimized for high-volume agentic tasks, translation, and simple data processing.
  - `models/gemini-3.1-flash-image`: Pro-level visual intelligence with Flash-speed efficiency and reality-grounded generation capabilities.
  - `models/gemini-3.5-flash`: Our most intelligent model for sustained frontier performance in agentic and coding tasks.

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

- **previous_interaction_id** (`string`) The ID of the previous interaction, if any.

- **response_format** (`ResponseFormat or array (ResponseFormat)`) Enforces that the generated response is a JSON object that complies with the JSON schema specified in this field.

- **safety_settings** (`array (SafetySetting)`) Safety settings for the interaction.

- **status** (`enum (string)`) *(Required)* Required. Output only. The status of the interaction.
  Possible values:
  - `in_progress`: The interaction is in progress.
  - `requires_action`: The interaction requires action/input from the user.
  - `completed`: The interaction is completed.
  - `failed`: The interaction failed.
  - `cancelled`: The interaction was cancelled.
  - `incomplete`: The interaction is completed, but contains incomplete results (e.g.
hitting max_tokens).

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
    curl -X POST https://generativelanguage.googleapis.com/v1/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
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
    curl -X POST https://generativelanguage.googleapis.com/v1/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
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
    curl -X POST https://generativelanguage.googleapis.com/v1/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
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
- **GoogleSearch**
    - A tool that can be used by the model to search Google.
     - **search_types** (`array (enum (string))`)  The types of search grounding to enable.
   Possible values:
   - `web_search`: Setting this field enables web search. Only text results are returned.
   - `image_search`: Setting this field enables image search. Image bytes are returned.

     - **type** (`object`) *(Required)*
   Value: `google_search`
    **Examples**
    **google_search**

    ```sh
    curl -X POST https://generativelanguage.googleapis.com/v1/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
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
    curl -X POST https://generativelanguage.googleapis.com/v1/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
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
    curl -X POST https://generativelanguage.googleapis.com/v1/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
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

     - **type** (`object`) *(Required)*
   Value: `video`

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

     - **summary** (`array (Content)`)  A summary of the thought.

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
     - **arguments** (`CodeExecutionCallStepArguments`)  The arguments to pass to the code execution.
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
     - **arguments** (`UrlContextCallArguments`)  The arguments to pass to the URL context.
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
- **GoogleSearchCallStep**
    - Google Search call step.
     - **arguments** (`GoogleSearchCallStepArguments`)  The arguments to pass to Google Search.
   - **queries** (`array (string)`)    Web search queries for the following-up web search.


     - **id** (`string`) *(Required)*  Required. A unique ID for this specific tool call.

     - **search_type** (`enum (string)`)  The type of search grounding enabled.
   Possible values:
   - `web_search`: Setting this field enables web search. Only text results are returned.
   - `image_search`: Setting this field enables image search. Image bytes are returned.

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

     - **result** (`string`)  The output of the code execution.

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

     - **result** (`array (UrlContextResult)`)  The results of the URL context.
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

     - **result** (`array (GoogleSearchResultItem)`)  The results of the Google Search.
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

     - **result** (`array (GoogleMapsResultItem)`)
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

