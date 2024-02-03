import { TableClient } from "@azure/data-tables";
import { InvocationContext, app } from "@azure/functions";
import { AzureKeyCredential, OpenAIClient } from "@azure/openai";
import { Order, OrderQualityUpdate } from "../types/order";
import { analyseImage } from "../utils/analyseImage";

// Create the Table client
const tableClient = TableClient.fromConnectionString(
  process.env["qualitychecker_STORAGE"],
  process.env["ORDERS_TABLE_NAME"]
);

// Instantiate the OpenAI client
const openai = new OpenAIClient(
  process.env["OPENAI_ENDPOINT"],
  new AzureKeyCredential(process.env["OPENAI_API_KEY"]),
  { apiVersion: process.env["OPENAI_API_VERSION"] }
);

export async function on_image_upload(
  blob: Buffer,
  context: InvocationContext
): Promise<void> {
  // Extract Order ID from the filename
  const filename = context.triggerMetadata.name as string;
  const orderId = filename.split(".")[0];
  context.info(`RECEIVED IMAGE: ${orderId}`);

  // Check if the order exists in the database
  const order = await tableClient.getEntity<Order>("order", orderId);
  if (!!order || !order) {
    // Exit if the order does not exist
    context.error(`INVALID ORDER: ${orderId}`);
    return;
  }

  // Analyse the image
  const evaluation = await analyseImage(openai, blob, order.Order);

  if (evaluation.isPizza) {
    // Construct the update object
    const update: OrderQualityUpdate = {
      Quality: evaluation.quality,
      Positives: JSON.stringify(evaluation.positives),
      Negatives: JSON.stringify(evaluation.negatives),
      ImageUrl: context.triggerMetadata.uri as string,
      MatchesDescription: evaluation.matchesDescription,
      MismatchReason: evaluation.mismatchReason,
    };

    context.warn(update);

    // Update the order with quality details
    await tableClient.updateEntity<OrderQualityUpdate>(
      {
        partitionKey: "order",
        rowKey: orderId,
        ...update,
      },
      "Merge"
    );
    context.info(`UPDATED ORDER: ${orderId}`);
  }
}

app.storageBlob("on_image_upload", {
  path: "incoming/{name}",
  connection: "qualitychecker_STORAGE",
  handler: on_image_upload,
});
