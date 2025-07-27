export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface ValidationOptions {
    checkUrls?: boolean;
    schemaOnly?: boolean;
}
export declare function validateAgentRecordYAML(filepath: string, options?: ValidationOptions): Promise<ValidationResult>;
export declare function validateEthereumAddress(address: string): boolean;
export declare function validatePrivateKey(privateKey: string): boolean;
//# sourceMappingURL=validation.d.ts.map