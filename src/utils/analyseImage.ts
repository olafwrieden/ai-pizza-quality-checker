import { ChatRequestMessage, OpenAIClient } from "@azure/openai";
import { PizzaEvaluation } from "../types/evaluation";

export const analyseImage = async (
  client: OpenAIClient,
  blob: Buffer,
  order: string
): Promise<PizzaEvaluation> => {
  const messages: ChatRequestMessage[] = [
    {
      role: "system",
      content:
        "You are a quality checker that assists a pizza baker in understanding toppings on a pizza and whether the pizza is a good quality-made pizza. Given an image and description, return a numeric quality score between 0-5 (unacceptable to excellent), and a few reasons that led to the evaluation. If the image does not match the type of pizza, set the quality to 0, matchesDescription to false, and provide a one sentence mismatchReason text. Respond exclusively in raw JSON without markdown, using this structure: { isPizza: true, quality: 3, matchesDescription: true, mismatchReason: '', posities: ['Even spread of toppings'], negatives: ['The pizza is burnt', 'The pizza has too much cheese'] }.",
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Analyse the pizza quality. The user ordered: ${order}`,
        },
        {
          type: "image_url",
          imageUrl: {
            url: `data:image/jpeg;base64,${blob.toString("base64")}`,
          },
        },
      ],
    },
  ];

  const { id, created, choices, usage } = await client.getChatCompletions(
    process.env["OPENAI_GPT4_VISION_DEPLOYMENT_NAME"],
    messages,
    {
      maxTokens: 4096,
      // responseFormat: { type: "json_object" }, // Not yet supported by GPT-4 Turbo with Vision
    }
  );

  return JSON.parse(choices[0].message.content) as PizzaEvaluation;
};
