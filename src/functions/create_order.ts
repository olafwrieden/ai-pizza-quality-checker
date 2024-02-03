import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  output,
} from "@azure/functions";
import { v4 } from "uuid";
import { CrateOrderApiSchema, NewOrder } from "../types/order";

const tableOutput = output.table({
  tableName: process.env["ORDERS_TABLE_NAME"],
  connection: "qualitychecker_STORAGE",
});

export async function create_order(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.info(`NEW ORDER Received!`);

  // Parse the request body
  const body = (await request.json()) as CrateOrderApiSchema;

  // Error if no customerId or order
  if (!body.customerId || !body.order) {
    context.error(`ORDER DECLINED: Missing parameters!`);

    return {
      status: 400,
      body: "Please pass a customerId and order text in the request body.",
    };
  }

  // Generate unique order id
  const orderId = v4();

  // Construct the order object
  const order: NewOrder = {
    PartitionKey: "order",
    RowKey: orderId,
    OrderId: orderId,
    CustomerId: body.customerId,
    Order: body.order,
  };

  // Create the order in the table
  context.extraOutputs.set(tableOutput, order);
  context.info(`ORDER CREATED: ${orderId}`);

  // Return the order to the API caller
  return { body: JSON.stringify(order), status: 201 };
}

app.http("create_order", {
  methods: ["POST"],
  route: "create_order",
  authLevel: "anonymous",
  extraOutputs: [tableOutput],
  handler: create_order,
});
