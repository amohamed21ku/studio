"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import * as faceapi from 'face-api.js';

export async function loadModels() {
  const MODEL_URL = '/models'
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
}

export async function applyGreyFaceMask(image: HTMLImageElement): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0)

  const detection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()

  if (!detection) throw new Error('No face detected')

  const lm = detection.landmarks
  const grey = 'rgb(160,160,160)'

  // Helper to draw a region
  const fillRegion = (points: faceapi.Point[]) => {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.fillStyle = grey
    ctx.fill()
  }

  // Cover left and right eyes
  fillRegion(lm.getLeftEye())
  fillRegion(lm.getRightEye())

  // Cover nose
  fillRegion(lm.getNose())

  // Cover mouth
  fillRegion(lm.getMouth())

  // Cover forehead (approximate from eyebrows + offset)
  const leftBrow = lm.getLeftEyeBrow()
  const rightBrow = lm.getRightEyeBrow()

  const foreheadPoints: faceapi.Point[] = [
    ...leftBrow.map(p => ({ x: p.x, y: p.y - 40 })),
    ...rightBrow.reverse().map(p => ({ x: p.x, y: p.y - 40 }))
  ]
  fillRegion(foreheadPoints)

  return canvas
}

const skinToneGrey = "#D3D3D3";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [bwImage, setBwImage] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState<number>(10);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [maskedImage, setMaskedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await loadModels();
      } catch (error) {
        console.error("Failed to load face-api models:", error);
        alert('Failed to load face detection models. Please check the console for details.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const imgDataUrl = reader.result as string;
      setImage(imgDataUrl);

      const image = new Image();
      image.src = imgDataUrl;
      image.onload = async () => {
          setIsLoading(true);
        try {
          const canvas = await applyGreyFaceMask(image);
          setMaskedImage(canvas.toDataURL('image/png'));
        } catch (error: any) {
          console.error("Face detection or masking failed:", error);
          alert(`Face detection or masking failed: ${error.message}`);
          setMaskedImage(null);
        } finally {
          setIsLoading(false);
        }
      };
      image.onerror = () => {
        console.error("Failed to load image");
        alert('Failed to load image.');
        setIsLoading(false);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!maskedImage) {
      alert("No masked image available to download.");
      return;
    }

    const a = document.createElement('a');
    a.href = maskedImage;
    a.download = 'masked_face.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <Card className="w-full max-w-2xl bg-card text-card-foreground shadow-md rounded-lg">
        <CardHeader className="flex flex-col items-center space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">Monochrome Mask</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Upload an image, convert it to black and white, and mask the facial features.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full text-sm"
          />
           <div className="w-full flex items-center justify-center">
            {image ? (
              isLoading ? (
                <div>Processing...</div>
              ) : maskedImage ? (
                 <img src={maskedImage} alt="Monochrome Masked Face" className="border border-border rounded-md shadow-sm" />
              ) : (
                <div>Face detection failed.</div>
              )
            ) : (
              <div>Please upload an image.</div>
            )}
          </div>

          <div className="w-full flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4">
            <Button onClick={handleDownload} disabled={!maskedImage} className="bg-teal-500 text-teal-50 text-teal-50 hover:bg-teal-700">
              Download Image
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
