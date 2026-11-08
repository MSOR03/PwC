export interface FileStorage {
  // Saves the file and returns the path where it was stored
  save(content: Uint8Array, originalName: string): Promise<string>;

  // Removes a stored file (used if the database transaction fails)
  delete(path: string): Promise<void>;
}