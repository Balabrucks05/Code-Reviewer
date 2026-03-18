import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImportResolverService {
  private readonly logger = new Logger(ImportResolverService.name);
  private readonly nodeModulesPath: string;
  private readonly v4Aliases: Record<string, string> = {
    '@openzeppelin/contracts/': '@openzeppelin/contracts-v4/',
    '@openzeppelin/contracts-upgradeable/': '@openzeppelin/contracts-upgradeable-v4/',
  };

  constructor() {
    this.nodeModulesPath = path.resolve(__dirname, '..', '..', '..', '..', 'node_modules');
    this.logger.debug(`Import resolver using node_modules at: ${this.nodeModulesPath}`);
  }

  resolveImport(importPath: string, sourceRef?: string): { contents?: string; error?: string } {
    if (!importPath.startsWith('@')) {
      return { error: `File not found: ${importPath}` };
    }

    const pathsToTry: string[] = [path.join(this.nodeModulesPath, importPath)];

    const cwdNodeModules = path.resolve(process.cwd(), 'node_modules');
    if (cwdNodeModules !== this.nodeModulesPath) {
      pathsToTry.push(path.join(cwdNodeModules, importPath));
    }

    let preferV4 = false;
    if (sourceRef) {
      const hasV5Ownable =
        sourceRef.includes('Ownable(msg.sender)') ||
        sourceRef.includes('Ownable(initialOwner)') ||
        sourceRef.match(/Ownable\s*\([^)]+\)/) !== null;
      preferV4 = !hasV5Ownable;
    } else {
      preferV4 = true;
    }

    if (preferV4) {
      for (const [prefix, alias] of Object.entries(this.v4Aliases)) {
        if (importPath.startsWith(prefix)) {
          const v4Path = importPath.replace(prefix, alias);
          if (cwdNodeModules !== this.nodeModulesPath) {
            pathsToTry.unshift(path.join(cwdNodeModules, v4Path));
          }
          pathsToTry.unshift(path.join(this.nodeModulesPath, v4Path));
          break;
        }
      }
    }

    for (const fullPath of pathsToTry) {
      try {
        if (fs.existsSync(fullPath)) {
          const contents = fs.readFileSync(fullPath, 'utf8');
          return { contents };
        }
      } catch (error) {
        // continue
      }
    }

    this.logger.warn(`Import failed: ${importPath}. Tried paths: ${pathsToTry.join(', ')}`);
    return { error: `File not found: ${importPath}` };
  }
}
