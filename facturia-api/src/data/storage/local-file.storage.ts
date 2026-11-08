import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { FileStorage } from '../../business/ports/file.storage';


export class LocalFileStorage implements FileStorage {
    constructor(private readonly baseDir: string) { }
    
    //saves file with a random name and returns the name
    async save(content: Uint8Array, originalName: string): Promise<string> {
        await mkdir(this.baseDir, { recursive: true });
        const extension = path
            .extname(originalName)
            .toLocaleLowerCase()
            .replace(/^\./, '');
        const fileName = `${randomUUID()}.${extension}`;
        await writeFile(path.join(this.baseDir, fileName), content);
        return fileName;

    }
    async delete(storedPath: string): Promise<void> {
        //prevents deleting files outside the base directory
        await rm(path.join(this.baseDir, path.basename(storedPath)), { force: true });
    }


}