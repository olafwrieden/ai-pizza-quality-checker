export interface CrateOrderApiSchema {
  customerId: string;
  order: string;
}

export interface NewOrder {
  PartitionKey: string;
  RowKey: string;
  OrderId: string;
  CustomerId: string;
  Order: string;
}

export interface OrderQualityUpdate {
  Quality: number;
  Positives: string;
  Negatives: string;
  ImageUrl: string;
  MatchesDescription: boolean;
  MismatchReason: string;
}

export interface Order extends NewOrder, OrderQualityUpdate {}
