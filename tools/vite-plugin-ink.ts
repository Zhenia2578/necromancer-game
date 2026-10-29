import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Compiler, CompilerOptions } from 'inkjs/compiler/Compiler';
import type { IFileHandler } from 'inkjs/compiler/IFileHandler';
import { ErrorType } from 'inkjs/engine/Error';
import type { Plugin } from 'vite';

/** Compiles imported `.ink` files to runtime JSON at build time; INCLUDEs resolve relative to the root file. */
export function ink(): Plugin {
  return {
    name: 'ink',
    transform(source, id) {
      if (!id.endsWith('.ink')) return null;

      const included: string[] = [];
      const fileHandler: IFileHandler = {
        ResolveInkFilename: (filename) => resolve(dirname(id), filename),
        LoadInkFileContents: (filename) => {
          included.push(filename);
          return readFileSync(filename, 'utf8');
        },
      };

      const errors: string[] = [];
      const options = new CompilerOptions(id, [], false, (message, type) => {
        if (type === ErrorType.Error) errors.push(message);
        else this.warn(message);
      }, fileHandler);
      const story = new Compiler(source, options).Compile();
      if (errors.length || !story) {
        this.error(`Ink compilation failed for ${id}:\n${errors.join('\n')}`);
      }
      included.forEach((file) => this.addWatchFile(file));
      return { code: `export default ${JSON.stringify(story.ToJson())};`, map: null };
    },
  };
}
