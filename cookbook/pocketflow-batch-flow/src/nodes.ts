import fs from 'fs';
import path from 'path';
import { Node } from 'pocketflow';
import sharp from 'sharp';
import { FilterType, SharedData } from './type';

// Create output directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, '../output'))) {
  fs.mkdirSync(path.join(__dirname, '../output'));
}

// Define interfaces for node parameters and results that satisfy NonIterableObject constraint
type LoadImageParams ={
  imageName: string;
}

type LoadImageResult = {
  imageBuffer: Buffer;
}

type ApplyFilterParams = {
  filterType: FilterType;
}

type SaveImageResult = {
  outputPath: string;
}

// Node to load an image
export class LoadImageNode extends Node<SharedData, LoadImageParams> {

  async prep(): Promise<string> {
    const imageName = this._params.imageName;
    return imageName;
  }

  async exec(prepRes: string): Promise<LoadImageResult> {
    console.log(`Loading image: ${prepRes}...`);
    const imagePath = path.join(__dirname, 'images', prepRes);
    const imageBuffer = fs.readFileSync(imagePath);
    
    return { imageBuffer };
  }

  async post(shared: SharedData, prepRes: string, execRes: LoadImageResult): Promise<string> {
    shared.imageBuffer = execRes.imageBuffer;
    shared.imageName = prepRes;
    return "apply_filter";
  }
}

// Node to apply a filter to an image
export class ApplyFilterNode extends Node<SharedData, ApplyFilterParams> {

  async prep(shared: SharedData): Promise<{
    filterType: FilterType;
    imageBuffer: Buffer;
  }> {
    const filterType = this._params.filterType;
    return {
      filterType,
      imageBuffer: shared.imageBuffer || Buffer.from([])
    }
  }

  async exec(prepRes: {
    filterType: FilterType;
    imageBuffer: Buffer;
  }): Promise<Buffer> {
    const filterType = prepRes.filterType;
    
    console.log(`Processing ${prepRes} with ${filterType} filter...`);
    
    let processedImage;
    switch (filterType) {
      case 'grayscale':
        processedImage = await sharp(prepRes.imageBuffer).grayscale().toBuffer();
        break;
      case 'blur':
        processedImage = await sharp(prepRes.imageBuffer).blur(10).toBuffer();
        break;
      case 'sepia':
        processedImage = await sharp(prepRes.imageBuffer)
          .modulate({ brightness: 1, saturation: 0.8 })
          .tint({ r: 255, g: 220, b: 180 })
          .toBuffer();
        break;
      default:
        throw new Error(`Unsupported filter type: ${filterType}`);
    }
    
    return processedImage;
  }

  async post(shared: SharedData, prepRes: {
    filterType: FilterType;
  }, execRes: Buffer): Promise<string> {
    shared.processedImage = execRes;
    shared.filterType = prepRes.filterType;
    return "save";
  }
}

// Node to save a processed image
export class SaveImageNode extends Node<SharedData> {

  async prep(shared: SharedData): Promise<{
    imageBuffer: Buffer;
    imageName: string;
    filterType: FilterType;
  }> {
    return {
      imageBuffer: shared.processedImage || Buffer.from([]),
      imageName: shared.imageName || "",
      filterType: shared.filterType || "grayscale"
    }
  }

  async exec(prepRes: {
    imageBuffer: Buffer;
    imageName: string;
    filterType: FilterType;
  }): Promise<SaveImageResult> {
    const outputName = `${path.parse(prepRes.imageName).name}_${prepRes.filterType}${path.parse(prepRes.imageName).ext}`;
    const outputPath = path.join(__dirname, '../output', outputName);
    
    fs.writeFileSync(outputPath, prepRes.imageBuffer);
    console.log(`Saved processed image to: ${outputPath}`);
    
    return { outputPath };
  }
}

export const loadImageNode = new LoadImageNode();
export const applyFilterNode = new ApplyFilterNode();
export const saveImageNode = new SaveImageNode();
