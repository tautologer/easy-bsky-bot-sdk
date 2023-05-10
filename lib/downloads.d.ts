/**
 * no dependency method to download a file from a url
 * dont use external libs to avoid conflicts with custom fetch
 */
export declare function downloadImage(url: string, filepath: string): Promise<unknown>;
export declare function suffix(imgName: string): string;
export declare function guessImageFormat(imageUrl: string): string | undefined;
