export type FilterType = 'grayscale' | 'blur' | 'sepia';

export interface SharedData {
  imageName?: string;
  imageBuffer?: Buffer;
  processedImage?: Buffer;
  filterType?: FilterType;
}

