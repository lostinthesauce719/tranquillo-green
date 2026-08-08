/**
 * Improved Mock Convex database with proper query evaluation
 */

// Evaluate a filter function against a record (simplified Convex query evaluation)
function evaluateFilter(record: unknown, filterFn: (q: any) => any): boolean {
  // The filter function receives a query builder; we need to simulate it
  // For our tests, we'll just check if the filter matches expected field conditions
  // In a full mock, you'd parse the filter AST; for tests we manually apply expected conditions
  return true; // placeholder - individual tests manually filter via our fixture setup
}

// Mock query builder that tracks filters
export class MockQueryBuilder<T extends Record<string, unknown>> {
  private tableName: string;
  private db: MockDatabase;
  private filters: Array<(q: any) => any> = [];
  private _limit?: number;

  constructor(db: MockDatabase, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  filter(filterFn: (q: any) => any) {
    this.filters.push(filterFn);
    return this;
  }

  withIndex(indexName: string, selector: (q: any) => any) {
    // For simplicity, we just track the selector as a filter
    this.filters.push(selector);
    return this;
  }

  limit(limit: number) {
    this._limit = limit;
    return this;
  }

  // Helper methods to simulate Convex query operators (used in filters)
  static operators(q: any) {
    return {
      eq: (field: string, value: unknown) => ({ type: "eq", field, value }),
      lte: (field: string, value: unknown) => ({ type: "lte", field, value }),
      gte: (field: string, value: unknown) => ({ type: "gte", field, value }),
      and: (...conditions: unknown[]) => ({ type: "and", conditions }),
      or: (...conditions: unknown[]) => ({ type: "or", conditions }),
      field: (field: string) => field,
    };
  }

  private matches(record: T): boolean {
    for (const filter of this.filters) {
      // Evaluate filter: create a mock query builder with operators
      const q = MockQueryBuilder.operators({});
      const condition = filter(q);

      if (!this.evaluateCondition(record, condition)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(record: T, condition: unknown): boolean {
    if (!condition) return true;

    switch ((condition as any).type) {
      case "eq":
        return record[(condition as any).field] === (condition as any).value;
      case "lte":
        return record[(condition as any).field] <= (condition as any).value;
      case "gte":
        return record[(condition as any).field] >= (condition as any).value;
      case "and":
        return (condition as any).conditions.every((c: any) => this.evaluateCondition(record, c));
      case "or":
        return (condition as any).conditions.some((c: any) => this.evaluateCondition(record, c));
      default:
        // If we can't parse, assume match (for complex nested conditions not in test scope)
        return true;
    }
  }

  async collect(): Promise<T[]> {
    const collection = this.db.getCollection<T>(this.tableName);
    const records = Array.from(collection.values());
    const filtered = records.filter(record => this.matches(record));
    if (this._limit !== undefined) {
      return filtered.slice(0, this._limit);
    }
    return filtered;
  }

  async first(): Promise<T | null> {
    const results = await this.collect();
    return results[0] || null;
  }

  async unique(): Promise<T | null> {
    return this.first();
  }
}

export class MockDatabase<T extends Record<string, unknown> = any> {
  private collections: Map<string, Map<string, T>> = new Map();

  constructor(initialData: Record<string, Record<string, T>> = {}) {
    Object.entries(initialData).forEach(([tableName, records]) => {
      this.collections.set(tableName, new Map(Object.entries(records)));
    });
  }

  private getCollection<T>(tableName: string): Map<string, T> {
    if (!this.collections.has(tableName)) {
      this.collections.set(tableName, new Map());
    }
    return this.collections.get(tableName)! as Map<string, T>;
  }

  async insert(tableName: string, data: T & { _id?: string }): Promise<string> {
    const collection = this.getCollection(tableName);
    const id = data._id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record = { ...data, _id: id } as T & { _id: string };
    collection.set(id, record);
    return id;
  }

  async get(tableName: string, id: string): Promise<T | null> {
    const collection = this.getCollection<T>(tableName);
    return collection.get(id) ?? null;
  }

  async update(tableName: string, id: string, data: Partial<T>): Promise<void> {
    const collection = this.getCollection<T>(tableName);
    const existing = collection.get(id);
    if (!existing) {
      throw new Error(`Record not found: ${tableName}/${id}`);
    }
    collection.set(id, { ...existing, ...data } as T);
  }

  query(tableName: string) {
    return new MockQueryBuilder<T>(this, tableName);
  }

  // Convenience method to directly set a record (for test setup)
  set(tableName: string, id: string, data: T): void {
    const collection = this.getCollection<T>(tableName);
    collection.set(id, data as T);
  }

  // Count records in a collection
  count(tableName: string): number {
    return this.getCollection(tableName).size;
  }

  // Clear all data
  clear(): void {
    this.collections.clear();
  }
}

// Re-exports for test files (already exported via class declarations above)