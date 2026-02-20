import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolves external Solidity import paths (e.g., @openzeppelin/contracts/...)
 * by reading source files directly from node_modules.
 * 
 * Supports both OpenZeppelin v5.x (current) and v4.x (legacy) import paths
 * by trying multiple package locations.
 */
@Injectable()
export class ImportResolverService {
    private readonly logger = new Logger(ImportResolverService.name);
    private readonly nodeModulesPath: string;

    /**
     * Maps v4-style package prefixes to their npm-aliased v4 package locations.
     * If a file is not found under the v5 package, we try the v4 alias.
     */
    private readonly v4Aliases: Record<string, string> = {
        '@openzeppelin/contracts/': '@openzeppelin/contracts-v4/',
        '@openzeppelin/contracts-upgradeable/': '@openzeppelin/contracts-upgradeable-v4/',
    };

    constructor() {
        this.nodeModulesPath = path.resolve(__dirname, '..', '..', '..', '..', 'node_modules');
        this.logger.log(`Import resolver using node_modules at: ${this.nodeModulesPath}`);
    }

    /**
     * Synchronous resolver for solc's import callback.
     * Returns { contents: string } on success, or { error: string } on failure.
     */
    resolveImport(importPath: string): { contents: string } | { error: string } {
        if (!importPath.startsWith('@')) {
            return { error: `File not found: ${importPath}` };
        }

        // Build a list of paths to try
        const pathsToTry: string[] = [
            path.join(this.nodeModulesPath, importPath),
        ];

        // Also try from process.cwd() node_modules (application root)
        const cwdNodeModules = path.resolve(process.cwd(), 'node_modules');
        if (cwdNodeModules !== this.nodeModulesPath) {
            pathsToTry.push(path.join(cwdNodeModules, importPath));
        }

        // If this is an OZ import, also try the v4 aliased package
        for (const [prefix, alias] of Object.entries(this.v4Aliases)) {
            if (importPath.startsWith(prefix)) {
                const v4Path = importPath.replace(prefix, alias);
                pathsToTry.push(path.join(this.nodeModulesPath, v4Path));
                if (cwdNodeModules !== this.nodeModulesPath) {
                    pathsToTry.push(path.join(cwdNodeModules, v4Path));
                }
                break;
            }
        }

        // Try each path in order
        for (const fullPath of pathsToTry) {
            try {
                if (fs.existsSync(fullPath)) {
                    const contents = fs.readFileSync(fullPath, 'utf8');
                    // Only log debug if not previously cached/spammy
                    // this.logger.debug(`Resolved import: ${importPath} -> ${fullPath}`);
                    return { contents };
                }
            } catch (error) {
                // Ignore read errors, try next path
            }
        }

        this.logger.warn(`Import failed: ${importPath}. Tried paths: ${pathsToTry.join(', ')}`);
        return { error: `File not found: ${importPath}` };
    }
}
