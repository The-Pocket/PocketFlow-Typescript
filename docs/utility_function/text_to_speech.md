---
layout: default
title: "Text-to-Speech"
parent: "Utility Function"
nav_order: 7
---

# Text-to-Speech

| **Service**          | **Free Tier**       | **Pricing Model**                                            | **Docs**                                                                                  |
| -------------------- | ------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **Amazon Polly**     | 5M std + 1M neural  | ~$4 /M (std), ~$16 /M (neural) after free tier               | [Polly Docs](https://aws.amazon.com/polly/)                                               |
| **Google Cloud TTS** | 4M std + 1M WaveNet | ~$4 /M (std), ~$16 /M (WaveNet) pay-as-you-go                | [Cloud TTS Docs](https://cloud.google.com/text-to-speech)                                 |
| **Azure TTS**        | 500K neural ongoing | ~$15 /M (neural), discount at higher volumes                 | [Azure TTS Docs](https://azure.microsoft.com/products/cognitive-services/text-to-speech/) |
| **IBM Watson TTS**   | 10K chars Lite plan | ~$0.02 /1K (i.e. ~$20 /M). Enterprise options available      | [IBM Watson Docs](https://www.ibm.com/cloud/watson-text-to-speech)                        |
| **ElevenLabs**       | 10K chars monthly   | From ~$5/mo (30K chars) up to $330/mo (2M chars). Enterprise | [ElevenLabs Docs](https://elevenlabs.io)                                                  |

## Example TypeScript Code

### Amazon Polly

```typescript
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { writeFileSync } from "fs";

async function synthesizeText() {
  // Create a Polly client
  const polly = new PollyClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: "YOUR_AWS_ACCESS_KEY_ID",
      secretAccessKey: "YOUR_AWS_SECRET_ACCESS_KEY",
    },
  });

  // Set the parameters
  const params = {
    Text: "Hello from Polly!",
    OutputFormat: "mp3",
    VoiceId: "Joanna",
  };

  try {
    // Synthesize speech
    const command = new SynthesizeSpeechCommand(params);
    const response = await polly.send(command);

    // Convert AudioStream to Buffer and save to file
    if (response.AudioStream) {
      const audioBuffer = Buffer.from(
        await response.AudioStream.transformToByteArray()
      );
      writeFileSync("polly.mp3", audioBuffer);
      console.log("Audio content written to file: polly.mp3");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

synthesizeText();
```

### Google Cloud TTS

```typescript
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { writeFileSync } from "fs";

async function synthesizeText() {
  // Creates a client
  const client = new TextToSpeechClient();

  // The text to synthesize
  const text = "Hello from Google Cloud TTS!";

  // Construct the request
  const request = {
    input: { text: text },
    // Select the language and SSML voice gender
    voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
    // Select the type of audio encoding
    audioConfig: { audioEncoding: "MP3" },
  };

  try {
    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);
    // Write the binary audio content to a local file
    writeFileSync("gcloud_tts.mp3", response.audioContent as Buffer);
    console.log("Audio content written to file: gcloud_tts.mp3");
  } catch (error) {
    console.error("Error:", error);
  }
}

synthesizeText();
```

### Azure TTS

```typescript
import {
  SpeechConfig,
  AudioConfig,
  SpeechSynthesizer,
} from "microsoft-cognitiveservices-speech-sdk";

async function synthesizeText() {
  // Create a speech configuration with subscription information
  const speechConfig = SpeechConfig.fromSubscription(
    "AZURE_KEY",
    "AZURE_REGION"
  );

  // Set speech synthesis output format
  speechConfig.speechSynthesisOutputFormat = 1; // 1 corresponds to Audio16Khz128KBitRateMonoMp3

  // Create an audio configuration for file output
  const audioConfig = AudioConfig.fromAudioFileOutput("azure_tts.mp3");

  // Create a speech synthesizer with the given configurations
  const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

  try {
    // Synthesize text to speech
    const result = await new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        "Hello from Azure TTS!",
        (result) => {
          synthesizer.close();
          resolve(result);
        },
        (error) => {
          synthesizer.close();
          reject(error);
        }
      );
    });

    console.log("Audio content written to file: azure_tts.mp3");
  } catch (error) {
    console.error("Error:", error);
  }
}

synthesizeText();
```

### IBM Watson TTS

```typescript
import { TextToSpeechV1 } from "ibm-watson/text-to-speech/v1";
import { IamAuthenticator } from "ibm-watson/auth";
import { writeFileSync } from "fs";

async function synthesizeText() {
  // Create a TextToSpeech client with authentication
  const textToSpeech = new TextToSpeechV1({
    authenticator: new IamAuthenticator({ apikey: "IBM_API_KEY" }),
    serviceUrl: "IBM_SERVICE_URL",
  });

  try {
    // Synthesize speech
    const params = {
      text: "Hello from IBM Watson!",
      voice: "en-US_AllisonV3Voice",
      accept: "audio/mp3",
    };

    const response = await textToSpeech.synthesize(params);
    const audio = response.result;

    // The wav header requires a file length, but this is unknown until after the header is already generated
    const repairedAudio = await textToSpeech.repairWavHeaderStream(audio);

    // Write audio to file
    writeFileSync("ibm_tts.mp3", repairedAudio);
    console.log("Audio content written to file: ibm_tts.mp3");
  } catch (error) {
    console.error("Error:", error);
  }
}

synthesizeText();
```

### ElevenLabs

```typescript
import { ElevenLabs } from "elevenlabs";
import { writeFileSync } from "fs";

async function synthesizeText() {
  // Initialize the ElevenLabs client
  const eleven = new ElevenLabs({
    apiKey: "ELEVENLABS_KEY",
  });

  try {
    // Generate speech
    const voiceId = "ELEVENLABS_VOICE_ID";
    const text = "Hello from ElevenLabs!";

    // Generate audio
    const audioResponse = await eleven.generate({
      voice: voiceId,
      text: text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.75,
      },
    });

    // Convert to buffer and save to file
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    writeFileSync("elevenlabs.mp3", audioBuffer);
    console.log("Audio content written to file: elevenlabs.mp3");
  } catch (error) {
    console.error("Error:", error);
  }
}

synthesizeText();
```
