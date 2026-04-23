/** QuickBooks Online API types (subset relevant to accounting export) */

export interface QBOCompanyInfo {
  CompanyName: string;
  LegalName: string;
  CompanyAddr: QBOAddress;
  Id: string;
}

export interface QBOAddress {
  Line1?: string;
  City?: string;
  CountrySubDivisionCode?: string;
  PostalCode?: string;
}

export interface QBOAccount {
  Id: string;
  Name: string;
  FullyQualifiedName: string;
  AccountType: string;
  AccountSubType: string;
  Active: boolean;
  CurrentBalance?: number;
  MetaData: { CreateTime: string; LastUpdatedTime: string };
}

export interface QBOJournalEntry {
  Id?: string;
  TxnDate: string;
  DocNumber?: string;
  PrivateNote?: string;
  Line: QBOJournalLine[];
  MetaData?: { CreateTime: string; LastUpdatedTime: string };
}

export interface QBOJournalLine {
  Id?: string;
  Description?: string;
  Amount: number;
  DetailType: "JournalEntryLineDetail";
  JournalEntryLineDetail: {
    PostingType: "Debit" | "Credit";
    AccountRef: { value: string; name?: string };
    ClassRef?: { value: string; name?: string };
    LocationRef?: { value: string; name?: string };
  };
}

export interface QBOTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
}

export interface QBOBatchRequest {
  BatchItemRequest: Array<{
    bId: string;
    operation: "create" | "update";
    JournalEntry?: QBOJournalEntry;
    Account?: Partial<QBOAccount>;
  }>;
}

export interface QBOBatchResponse {
  BatchItemResponse: Array<{
    bId: string;
    JournalEntry?: QBOJournalEntry & { domain: string; status: string };
    Fault?: {
      Error: Array<{ Message: string; code: string; Detail?: string }>;
      type: string;
    };
  }>;
}
