import { CLIConfig } from '../types/config';
export declare function getConfig(): Promise<CLIConfig>;
export declare function saveConfig(config: CLIConfig): Promise<void>;
export declare function updateConfig(updates: Partial<CLIConfig>): Promise<CLIConfig>;
export declare function resetConfig(): Promise<CLIConfig>;
export declare function getConfigWithEnvOverrides(): Promise<CLIConfig>;
//# sourceMappingURL=manager.d.ts.map