import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { fitWithin } from "./imageUtils";

// Turns a picked or captured image (any format the phone can read, including HEIC) into a small JPEG with base64 data.
// Works from a file location, so the picker never has to hand a huge base64 string across to JavaScript.
export const prepareImage = async (uri) => {
  let image = await ImageManipulator.manipulate(uri).renderAsync();
  const resize = fitWithin(image.width, image.height);
  if (resize) image = await ImageManipulator.manipulate(image).resize(resize).renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  return { uri: saved.uri, base64: saved.base64, width: saved.width, height: saved.height };
};
