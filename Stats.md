# Audiobook Studio Stats, etc.

## AI Studio Snapshots

<!-- markdownlint-disable MD013 MD022 MD031 MD048 -->

~~~json
[
  {
      "prompt": "Local user changes",
      "timestamp": "Jul 19, 5:05 PM"
  },
  {
      "prompt": "Fix the errors in the app",
      "timestamp": "Jul 18, 9:18 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-19T01:34:39.690048Z",
      "timestamp": "Jul 18, 8:34 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-19T01:29:48.249289Z",
      "timestamp": "Jul 18, 8:29 PM"
  },
  {
      "prompt": "oh mercy, I've dug around quite a bit in the project trying and trying to figure out eslint and stylistic/eslint-plugin-ts I think, and I just could not. but that's how I learn, I guess. the nice thing is that unlike PowerShell there's a ton of integration since electron is built on node, a billion modules for every like, 10 that powershell has (and usually only 1-2 options for major things like linting, testing, static analysis, debugging, etc.) and the things that *do* try to replicate ecmascript-like features like auto-updating dependencies (PSDepend) rely on community support, for which there's... a pretty small number of very active contributors who do like, 50% of the work keeping up PowerShell, PSES, PSScriptAnalyzer, Pester, meanwhile I wonder how long it's been since the tried-and-kinda-lame ActiveDirectory module has been updated? oh *thaaaat's* right, it's a part of \"RSAT\" and isn't even on PSGallery so probably 10+ years! weeeee\n\nanyway I might have broken a few references as I removed some legacy interfaces, but it does at least run and the API is working.\n\nunfortunately bug #1 right now is that the fancy new settings dialogue is like... completely unreferenced in App.tsx. how'd that happen, eh?",
      "timestamp": "Jul 18, 4:30 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-18T21:09:21.423773Z",
      "timestamp": "Jul 18, 4:09 PM"
  },
  {
      "prompt": "alright, let's do it",
      "timestamp": "Jul 18, 2:15 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-17T17:19:39.668516Z",
      "timestamp": "Jul 17, 12:19 PM"
  },
  {
      "prompt": "alright, let's start track 1",
      "timestamp": "Jul 17, 11:46 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-17T16:41:59.900453Z",
      "timestamp": "Jul 17, 11:41 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-17T16:12:02.628195Z",
      "timestamp": "Jul 17, 11:12 AM"
  },
  {
      "prompt": "ah, strange. I can see the full damn checkpoint history from the start with diffs for every one. and yet it *doesn't export that to github* or even... downloading each copy w/ prompt and response. like it's all stored there, and somehow there's no room for a couple booleans to save custom instructions and editor settings. argh.\n\nanyway, I have a *ton* of ideas for additions -- which you can see in `todo.md`. I'm not quite sure which is the first we should get going on as they kind of all interconnect to make up an overhaul.\n\nSo please produce a plan for implementation first, and then we'll start moving through the steps. I think starting with the config dialogue makes the most sense, but correct me if I'm wrong:\n\n- Multiple settings dialogues, either taking up ~80% or so of the client area (with tabs for multiple pages), or making them reusable draggable/resizable windows that don't block input and have a \"windowshade\" / minimized form. attached is my garbage drawing using AI Studio's markup tool but... honestly if I knew it was just going to mark it over a screenshot I would have made it in Paint.NET like a real mockup if that works better lol. let me know if I should do that, like if this one makse no sense visually\n\n- I also had the idea of adding the settings programmatically based on the project JSON schema, or a new one just for app settings, similar to how VS Code works, where strings are a text box, string arrays are either multi-line textboxes or multiple text boxes that can be added/removed, booleans are checkboxes, enums are dropdowns, etc. and there's just a standard Title / Description layout (perhaps using `$comment` for icons? idk).\n\nanyway, all of this is going to be necessary for:\n- adding the new \"Scenes\" block \n- moving chapters to the sidebar so only snippets per-chapter are showing at any time\n- moving generation settings to the settings window\n- moving speaker settings to the settings window -- there will still be a list in the sidebar, but a minimal selection list just showing name, voice, color, with a config button to open it in the settings UI\n- adding a markdown editor in the settings dialogue containing the full Prompt that will be sent to the API based on the Gemini documentation's recommended schema. I've looked at a few npm packages, and I think react-md-editor is a strong and very lightweight, performant candidate (I think it's like a 60kb package?), as is markdown-text-editor, both based on like, `textinput` wrappers, I think, rather than full Monaco or whatever else. I don't know if any npm package is typescript compatible or how that all works, so you'll have to give me some feedback there.",
      "timestamp": "Jul 17, 10:52 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-17T15:51:25.683795Z",
      "timestamp": "Jul 17, 10:51 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-17T08:53:35.462297Z",
      "timestamp": "Jul 17, 3:53 AM"
  },
  {
      "prompt": "phew. it's been a minute. I've made some changes for documentation's sake, and also found some good news / bad news items. for now, if you're able to see the chat history, could you summarize and enter the major features added / changed / removed / fixed in a CHANGELOG.md following the keepachangelog format? I guess this also means versioning... I'll leave that up to you I guess, unless you need me to decide something. also, note the GEMINI.md instructions there now",
      "timestamp": "Jul 16, 7:40 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-17T00:24:54.659686Z",
      "timestamp": "Jul 16, 7:24 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-17T00:16:22.020008Z",
      "timestamp": "Jul 16, 7:16 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-16T23:32:18.557319Z",
      "timestamp": "Jul 16, 6:32 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-16T14:12:47.580736Z",
      "timestamp": "Jul 16, 9:12 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-16T11:44:24.687235Z",
      "timestamp": "Jul 16, 6:44 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-16T02:31:23.730935Z",
      "timestamp": "Jul 15, 9:31 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-15T14:48:39.276313Z",
      "timestamp": "Jul 15, 9:48 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-13T17:06:02.882667Z",
      "timestamp": "Jul 13, 12:06 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-10T07:53:41.013991Z",
      "timestamp": "Jul 10, 2:53 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-10T07:42:05.228115Z",
      "timestamp": "Jul 10, 2:42 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-10T07:17:39.335957Z",
      "timestamp": "Jul 10, 2:17 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-10T06:56:00.167488Z",
      "timestamp": "Jul 10, 1:56 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-10T06:23:31.271170Z",
      "timestamp": "Jul 10, 1:23 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-10T05:42:02.613059Z",
      "timestamp": "Jul 10, 12:42 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-10T02:13:01.636910Z",
      "timestamp": "Jul 9, 9:13 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-09T14:12:51.812467Z",
      "timestamp": "Jul 9, 9:12 AM"
  },
  {
      "prompt": "the tab doesn't seem to be visible initially -- it appears when playing audio, but once stopped, it disappears along with the bar\n\ni wonder if I can diagnose this...\n\nis its opacity / state possibly inheriting from the whole waveformplayer properties instead of having its own static opacity at 1?",
      "timestamp": "Jul 9, 12:53 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-09T05:47:00.691717Z",
      "timestamp": "Jul 9, 12:47 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-09T05:45:46.838981Z",
      "timestamp": "Jul 9, 12:45 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-09T05:43:03.168765Z",
      "timestamp": "Jul 9, 12:43 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-09T05:40:57.475927Z",
      "timestamp": "Jul 9, 12:40 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-09T05:36:26.953776Z",
      "timestamp": "Jul 9, 12:36 AM"
  },
  {
      "prompt": "man I think we've got this down. I had the instructions split the text by newline and then join it again with spaces. and the error diagnostics are ... well, I'd like to say they're more useful, but...\n\nGemini API returned an empty audio response. Details:\n```json\n{\"responseId\":\"bg9PatKHK5iN48AP8s2vuAM\",\"promptFeedback\":{\"blockReason\":\"PROHIBITED_CONTENT\",\"blockReasonMessage\":\"The prompt could not be submitted. The prompt contains sensitive words that violate Google's [Generative AI Prohibited Use policy](https://policies.google.com/terms/generative-ai/use-policy). Try rephrasing the prompt.\"}} \n```\n\nwhat was the text, you ask?\n\n> [clarifying] \"From earlier, when something got in it outside.\"\n\n🤦🏻‍♂️\n\nsure, okay google.\n\nanyway, the audio player is very nice, but:\n- the waveform preview window doesn't display anything\n- scrubbing is not currently working, though the onhover duration display is fine.\n- there's no current position indicator. perhaps use the onhover position indicator, but add... perhaps a 1px vertical line over the scrub/waveform element, bright cyan 40% opacity / #00FFFF66 RGBA, w/ 2px glow on either side *if* that's easy enough with CSS.\n- then, duplicate it for the onhover, but just make the whole thing 50% alpha\n- add a little clickable tab on top of the audio player, which when hidden, the tab will still show, and clicking it will restore the player.\n- position the aforementioned tab perhaps at whatever X value the sidebar drag control is at, and when the sidebar is hidden, it's positioned all the way to the right (minus its own width) so it stays out of the way.\n \nlastly, let's remove the pacing/pitch/emotion dropdowns and from speaker. I dial that in with the instructions and inline directions, and they don't seem to be working anyway, so, may as well just toss 'em",
      "timestamp": "Jul 9, 12:22 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-09T04:52:13.137157Z",
      "timestamp": "Jul 8, 11:52 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-09T04:39:16.044116Z",
      "timestamp": "Jul 8, 11:39 PM"
  },
  {
      "prompt": "okay, but you know that `generateContent()` wants the 'contents' key formatted like `<instructions>: <text>` specifically, right? at least according to the \"official\" documentation. but maybe it's only a suggestion and their documentation sucks.\n\neither wayI see it's currently being assembled into `[Voice performance cue: $instructions]\\n\\n$text`\n\nbut shit, if it accepts it, and doesn't trim out the newlines, that's a hell of a lot better than a fucking colon. why the hell wouldn't they just use two fields like the Cloud TTS sythesizeSpeech method does? it's maddening. even if the model only accepts a single natural language prompt, separating them in the request at least makes sure they aren't incorrectly parsed when run through whatever else the API does before the model gets it.\n\nso, if you find documentation that contradicts what I read (likely tbh), please link me to it.\n\noh shit, wait: I think we might be in business anyway. generate works, although preview failed with an empty response which is unfortunately normal... it always seems to be down to:\n- the text being too short\n- the model not having enough context to go on, e.g. incomplete sentences. I've had to remove a lot of simple narration connecting two spoken lines, like \"...she said, smiling.\" or else expanding them with filler \"Then, she continued,\".\n- some opaque hard-set filters for certain patterns. like \"baby\" used as a term of endearment next to sexual content, almost positive they do this with 'girl' and 'boy' and anything else that implies youth. it's so tedious trying to guess what regex their dumb classifier is matching.\n\nso, getting better feedback would be nice, but looking through the generateContentResponse fields, I didn't seem to find one that would give a god damn specific reason why it didn't return audio. however, it could be that I'm not expanding the object correctly since:\n\n` [Client] TTS Generation Error:\n  Gemini API returned an empty audio response. Response ID: xfVOasm8GP6MxMwP0tjtuAY; Feedback: [object Object] `\n\nobviously the ID is kind of useless, but the feedback at least shows it's an object. and I probably formatted the line wrong @ server.ts:364. it seems `response.promptFeedback` is an object with further properties, and its... ugh, I used to have \"use PowerShell analogies when explaining something\" in my system instructions until they went bye-bye with the browser cache! fucking google. anyway, the equivalent I think of is `$response.promptFeedback.ToString()` and the default from `[system.object]` is to just spit out its type name lol. so clearly TS / JS does something similar, but I don't know what the equivalent is.\n\nand I can't look at *what* properties it has right now, because for some lovely reason, every god damn fucking Monaco is FUBAR atm. can't use any commands that involve the UI, like find, replace, command palette, ctrl+space for intellisense (even though tooltips work), and even right-clicking and going to Command Palette doesn't bring it up. I guess I should clear my cache, but who knows what other prefs that will destroy! wee!",
      "timestamp": "Jul 8, 9:58 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-09T02:56:58.380758Z",
      "timestamp": "Jul 8, 9:56 PM"
  },
  {
      "prompt": "I am not good. I wish I was, but I'll probably give this one more try before going back to agent platform for now. after all, that's still working despite lacking the audio player, but we haven't yet implemented the full m4b output. but then so long as I have the audio files and project data, I can script that with ffmpeg or something. that's the most important that.\n\n```json\n [Client] TTS Generation Error:\n  Gemini Speech generation failed: {\"error\":{\"code\":400,\"message\":\"Please use a valid role: user, model.\",\"status\":\"INVALID_ARGUMENT\"}} \n```\n\nthis is a new one. role: `user, model`. what would 'user' be, I wonder.\n\nI tried it with a service account key created from the same AI Studio key generated here and used in API_KEY, and tried using a service account key from the vertexairunner service account I've been using for Agent Platform this whole time. it seems the secrets page won't let you use anything but keys with services accounts with access to the Gemini API which I guess makes sense. but I had the same error message from both; one connected to the Gemini API and one to the Agent Platform API. and I ... still don't really know the god damn difference.\n\nhahhh.",
      "timestamp": "Jul 8, 8:08 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-09T01:02:42.611147Z",
      "timestamp": "Jul 8, 8:02 PM"
  },
  {
      "prompt": "oh god please save me, an 400 \"allowlisted\" error. I already went through these and it was... wait. what the fuck is this about? these aren't \"equivalent\" model IDs, these are the literal TTS models you access via vertex / GCEAP API. please remove this and use the *actual* tts models. those are the models you use... for TTS, amazingly. I know, I couldn't believe it either! /s",
      "timestamp": "Jul 8, 7:53 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-09T00:52:38.188919Z",
      "timestamp": "Jul 8, 7:52 PM"
  },
  {
      "prompt": "alright, I stuck the info into .env and got a 429 again on preview.",
      "timestamp": "Jul 8, 7:47 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-09T00:43:49.218064Z",
      "timestamp": "Jul 8, 7:43 PM"
  },
  {
      "prompt": "oh god dammit. I knew it was too good to be true.\n\nalright, this is the problem now. you done good, but I think might be no way to use AI Studio for this app and also dip into my $300 GCloud credits which have been getting applied to all my agent platform & gemini TTS requests.\n\nwhen I first hit 'preview/generate' it had reset my API key from the AIStudio one I generated, tied to my Cloud project and billing, back to the default key it generated for me when I first started using this cursed thing, which has a very low limit on token use. also, of fucking course it reset my API key preference! it saves your god damn preferences in the *FUCKING BROWSER CACHE* instead of server-side! wow, cool feature! do you like, have to get on a PrEmIuM pLaN to store your fucking 5kb of system instructions and a few booleans for your monaco prefs? or do you just type those in every time you open the god damn app? (obviously it's the latter, it's always been the latter! ha ha!)\n\n</ranting>\n\nanyway, once I set the API key to the one I setup on the cloud side w/ server acct etc... I got a *new* error. not that it wouldn't accept the key, but...\n```json\nGemini Speech generation failed: {\"error\":{\"code\":429,\"message\":\"Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing. Learn more at https://ai.google.dev/gemini-api/docs/billing#prepay. \",\"status\":\"RESOURCE_EXHAUSTED\"}} \n```\n\nso, the main reason I wanted to really work on this and hammer it to generate as many audio takes as I could because that $300 credit expires at the end of next month. and if they use completely different billing on this end... that defeats the whole purpose I'm afraid.",
      "timestamp": "Jul 8, 7:27 PM"
  },
  {
      "prompt": "holy shit, that's... nice. I was like \"i would bet $100 this will not work\" and, it looks like I'm out $100 lol. \"[hard aussie] ON'YA!\"\n\none issue, though. as these are romance novels... they get spicy. that's why I *specifically* had the safety setting enums in the request. now I don't... quite understand, are we essentially using the Gemini REST API instead of using the @google/genai node library?\n\n```js\n       safetySettings: [\n          {\n            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,\n            threshold: HarmBlockThreshold.BLOCK_NONE\n          },\n          {\n            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,\n            threshold: HarmBlockThreshold.BLOCK_NONE\n          }\n        ],\n```",
      "timestamp": "Jul 8, 7:04 PM"
  },
  {
      "prompt": "sooo, it seems that what I feared has happened.\n\nthe API key I set up for this (instead of the default one that has a bunch of limits) I connected to a service account, and granted that service account the same roles and access the agent platform key has, etc.\n\nbut...\n\n```json\nFailed to generate snippet:\n  {\"error\":{\"code\":401,\"message\":\"API keys are not supported by this API. Expected OAuth2 access token or other authentication credentials that assert a principal. See https://cloud.google.com/docs/authentication\",\"status\":\"UNAUTHENTICATED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.ErrorInfo\",\"reason\":\"CREDENTIALS_MISSING\",\"domain\":\"googleapis.com\",\"metadata\":{\"service\":\"aiplatform.googleapis.com\",\"method\":\"google.cloud.aiplatform.v1beta1.PredictionService.GenerateContent\"}}]}} \n```",
      "timestamp": "Jul 8, 6:49 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-08T23:36:21.653750Z",
      "timestamp": "Jul 8, 6:36 PM"
  },
  {
      "prompt": "nope, something is *seriously* wrong. whatever workarounds you added should be reverted as it didn't solve the core issue: it feels laggy, the buttons don't respond to onHover, and tellingly, the mouse cursor doesn't change to a hand when hovering over interactable elements. AI Studio's controls work fine, so it's not the browser, but something discretely in the app preview / sandbox.\n\nalso, perhaps tellingly, the preview displays a block of white on the bottom with an empty project, i.e. not enough chapters/snippets or speakers to necessitate drawing all the way to the bottom. it's like it drew only the necessary UI elements and then stopped before drawing the rest of the client area. it's not like that in Agent Platform, nor was the previous audiobook studio app like this. only when the former was merged did this start.\n\nso, just like my preferences state, please do not write any \"custom workarounds\" for anything -- the app's code *in its initial state* was working in Agent Platform, so something just needs to be resolved.\n\nI can look at a diff between app.tsx as it is now and the original one provided if necessary to see if I catch anything. I can also upload the entire Agent Platform project archive if needed for comparison.",
      "timestamp": "Jul 7, 3:13 PM"
  },
  {
      "prompt": "okay, it feels like that entire Step 5 part of the plan, e.g. combining features of both UIs, was just... forgotten about. perhaps it's my fault for the JS vs PS tangent.\n\nthe UI is still not responding to hover events, *except* for the Snippet background color, oddly, which fades smoothly. however, the buttons on the right don't appear. very strange.",
      "timestamp": "Jul 7, 2:47 PM"
  },
  {
      "prompt": "wait, except uh... why was the waveform player deleted? we were keeping that functionality. also, there's something up with the preview, as it's not reacting to any onHover events at all, and no animations. the auto-save notifier turning the Save button green is just a single-frame on/off without the linear fade. I suspect this has something to do with the react UI update loop somehow?",
      "timestamp": "Jul 7, 2:27 PM"
  },
  {
      "prompt": "something's up with the in-chat file uploader so i've added the Phase 1 `/services` folder to the project",
      "timestamp": "Jul 7, 1:48 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-07T18:41:57.998816Z",
      "timestamp": "Jul 7, 1:41 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-07T18:40:24.164685Z",
      "timestamp": "Jul 7, 1:40 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-07T17:14:29.596678Z",
      "timestamp": "Jul 7, 12:14 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-07T16:38:47.003661Z",
      "timestamp": "Jul 7, 11:38 AM"
  },
  {
      "prompt": "Snapshot from 2026-07-05T19:37:05.575559Z",
      "timestamp": "Jul 5, 2:37 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-05T18:04:33.361314Z",
      "timestamp": "Jul 5, 1:04 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-05T17:43:47.523321Z",
      "timestamp": "Jul 5, 12:43 PM"
  },
  {
      "prompt": "Snapshot from 2026-07-05T17:20:26.500521Z",
      "timestamp": "Jul 5, 12:20 PM"
  },
  {
      "prompt": "> Root Cause: The user-selected models (e.g., gemini-2.5-flash-tts or gemini-2.5-pro-tts) do not support dedicated responseModalities: [\"AUDIO\"] output configuration on API v1beta.\n\nthis is *patently false*. all four current Gemini TTS models support audio modality. what documentation, if it wasn't just a hallucination, did you go by to decide this, like seriously? I'd be genuinely curious to know how you came up with this, even though I realize you don't respond to questions with second-person responses.\n\nmaybe you could slip it into your metacognition like \"I'm thinking about the user's question re: my API documentation on gemini TTS models and will answer with (...)\".\n\nanyway, see: [Gemini TTS models](https://docs.cloud.google.com/text-to-speech/docs/gemini-tts#available_models)\n\n## CHANGES:\n\n- remove the \"robust model re-mapping\" (i.e. just ignoring the selected model lol) and just *use the selected model*. I promise you all of them support AUDIO MODALITY. christ.\n- the \"local speech-like synthesizer fallback\" is utterly unnecessary, and has never worked. I'm never going to use it. if I hear it, it means the API isn't connecting for some reason. *that's* what needs to be addressed. if it's in the pipeline somewhere, keeping the pitch and speed settings is fine, but otherwise the only thing I've been using for these models is natural language instructions and inline `[direction]` tags.\n- The API is working properly on the narration blocks when clicking Synthesize, so it's clear there's something up with the \"Audition Custom Role Settings\" / speaker preview action specifically, so that needs to be fixed.\n- The \"Synthesize Sentence\" button should just read \"Synthesize\"\n- Editing narration text should *not* revert the playback controls to the synthesize button. once the block has synthesized audio, perhaps place a small iconified button alongside the playback controls using the same yellow color, but using a 🔃/\"refresh/reload\" sort of icon with a \"Re-synthesize\" tooltip\n- When clicking \"Synthesize\", disable the button until the api returns or throws an error, perhaps changing the text to \"Synthesizing...\" and pulsing the button, i.e. fading between a gray \"disabled\" color and a darker yellow, perhaps 1s per gradation or 2s for the full cycle, with a lead-out animation type\n- make the sidebar resizable by width\n- add a small button towards the bottom of the sidebar to toggle its visibility, perhaps with a quick 300ms lead-out slide",
      "timestamp": "Jun 26, 7:39 AM"
  },
  {
      "prompt": "keep the 'aside' bar fixed when scrolling 'main' so the audiobooks and chapters are always in-view.\n\nin the bottom div for narration blocks, replace \"Uses global performance directives (...)\" with a live character, word, and (if possible) approx. token count of the text. e.g. \"Chars: 100 • Words: 25 • Tokens: ~30\", perhaps using appropriate icons with text descriptions in a tooltip\nApply style changes to the selected element(s).",
      "timestamp": "Jun 26, 5:35 AM"
  },
  {
      "prompt": "the voices are broken again, making computery-vowel noises instead of speech.\n\nI've updated the list of voices as well in types.ts, but you'll have to provide the descriptions and colors",
      "timestamp": "Jun 25, 7:28 PM"
  },
  {
      "prompt": "Snapshot from 2026-06-26T00:21:20.901042Z",
      "timestamp": "Jun 25, 7:21 PM"
  },
  {
      "prompt": "Snapshot from 2026-06-26T00:18:06.701305Z",
      "timestamp": "Jun 25, 7:18 PM"
  },
  {
      "prompt": "Snapshot from 2026-06-25T23:37:56.205494Z",
      "timestamp": "Jun 25, 6:37 PM"
  },
  {
      "prompt": "the project should be based around pre-configured \"Speakers\" or \"Roles\", each of which has:\n1. a name\n2. a checkbox marking it as \"Narrator\"\n3. an assigned gemini voice\n4. a selectable model to provide the voice\n  A. as I understand it, there are four current gemini TTS models: 3.1 flash, 2.5 flash, 2.5 pro (preview), and 2.5 flash lite (preview)\n5. performance directives (this will take the place of the per-narration block \"acousting performance directives input)\n\nthis will be configured in the Studio Cast Desk, which will require the ability to add, remove, and modify speakers.",
      "timestamp": "Jun 25, 6:24 PM"
  },
  {
      "prompt": "Snapshot from 2026-06-25T23:18:28.508316Z",
      "timestamp": "Jun 25, 6:18 PM"
  },
  {
      "prompt": "sigh. charming? aka \"the main thing you want this app to do doesn't work so instead it falls back to Microsoft Sam\". I didn't know AI could glaze itself, too. vibe-coding is dangerous as shit. this is just a toy for me, but for people building serious infrastructure with it? oof. the UI looks great, it's very slick *as a mockup* without a working backend.\n\nalso, `Technical Accomplishments` is hilarious considering it's still producing beeps and boops. charming. foh.",
      "timestamp": "May 29, 11:40 AM"
  },
  {
      "prompt": "well. the preview and narration synthesis is more... interesting, but whatever audio it's producing, it's not speech.",
      "timestamp": "May 29, 11:15 AM"
  },
  {
      "prompt": "this is insane. I wish agentic coding was as good for PowerShell as it is for ts/js frameworks and web app stuff.\n\nnonetheless, the voice preview is now producing sound, but... it's just a pulsing waveform instead of speech lol. when synthesizing a voice line, it completes and produces ~10s of staticky pulses.\n\nalso, the new project, new chapter, delete chapter, and delete active project buttons appear to be broken.",
      "timestamp": "May 29, 10:58 AM"
  },
  {
      "prompt": "Snapshot from 2026-05-29T15:47:48.984305Z",
      "timestamp": "May 29, 10:47 AM"
  },
  {
      "prompt": "Fix the errors in the app",
      "timestamp": "May 29, 10:42 AM"
  },
  {
      "prompt": "Apply the \"Elegant Dark\" design theme to the app.",
      "timestamp": "May 28, 7:04 PM"
  },
  {
      "prompt": "I've been looking all over for a decent AI text-to-speech site focused on audiobook creation with support for multiple voices per chapter (often changing by paragraph as with ElevenLabs and NaturalReader) that also offers a decent studio interface for managing long-form narration projects. The ability to fine-tune voice pacing, emphasis, and emotional inflection, whether per-paragraph or, ideally, via tags like `[laughing] \"I can't believe you said that!\"` and such.",
      "timestamp": "May 28, 6:58 PM"
  }
]
~~~


## Request timing
```json
["Time","Text C.","Prompt C.","Text W.","Prompt W.","Req. T.","Resp. T.","Total T."]
[25.666,947,1474,162,250,336,1519,1855]
[27.414,891,1418,157,245,346,1544,1890]
[11.817,283,810,56,144,204,451,655]
[30.925,871,1398,151,239,313,2798,3111]
[17.770,547,915,99,151,239,1045,1284]
[10.611,298,666,56,108,157,596,753]
[12.714,469,996,83,171,235,1516,1751]
[30.421,919,1287,159,211,309,1889,2198]
[17.978,715,1242,126,214,285,2137,2422]
[33.425,921,1289,172,224,290,1629,1919]
[31.770,927,1295,167,219,295,1695,1990]
[28.751,815,1183,156,208,265,1528,1793]
[44.002,1436,1804,253,305,391,2782,3173]
[54.038,1214,1582,208,260,325,3024,3349]
[31.147,1058,1426,193,245,323,1913,2236]
[48.495,474,842,80,132,179,912,1091]
[18.653,549,917,95,147,199,1111,1310]
[20.088,384,752,67,119,172,761,933]
[27.363,745,1113,132,184,242,1449,1691]
[11.907,347,715,60,112,154,664,818]
[33.407,980,1348,164,216,351,1956,2307]
[42.414,856,1224,157,209,303,1673,1976]
[26.125,881,1249,152,204,271,1575,1846]
[31.967,889,1257,165,217,282,1557,1839]
[33.455,899,1426,150,238,319,2803,3122]
[26.487,899,1267,150,202,276,1590,1866]
[31.676,953,1321,173,225,292,3166,3458]
[28.324,925,1293,161,213,276,2945,3221]
[23.921,745,1113,131,183,254,1224,1478]
[27.346,732,1100,130,182,261,2687,2948]
[58.017,478,846,82,134,199,1978,2177]
[26.150,835,1203,139,191,278,1615,1893]
[18.150,576,944,103,155,212,1083,1295]
[26.920,801,1169,145,197,261,1458,1719]
[24.833,913,1281,162,214,285,1529,1814]
[77.447,871,1239,151,203,264,2993,3257]
[22.703,183,551,32,84,124,765,889]
[16.062,469,837,83,135,186,1688,1874]
[20.357,715,1083,126,178,236,1217,1453]
```
