"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {monochromeMask} from '@/ai/flows/monochrome-mask-flow';

const skinToneGrey = "#D3D3D3";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [bwImage, setBwImage] = useState<string | null>(null);
  const [maskedImage, setMaskedImage] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState<number>(10);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!image) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      imageRef.current = img;
      convertToBlackAndWhite(img);
    };

  }, [image]);

  const convertToBlackAndWhite = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }

    ctx.putImageData(imageData, 0, 0);
    setBwImage(canvas.toDataURL('image/png'));
  };


  useEffect(() => {
    if (!bwImage) return;

    const canvas = canvasRef.current;
    const img = imageRef.current;

    if (!canvas || !img) return;

    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }

    ctx.drawImage(img, 0, 0);
    convertToBlackAndWhiteCanvas(canvas, img);

    let drawing = false;

    const startDraw = (e: MouseEvent) => {
      drawing = true;
      draw(e);
    };

    const stopDraw = () => {
      drawing = false;
      ctx.beginPath();
    };

    const draw = (e: MouseEvent) => {
      if (!drawing) return;

      const x = e.offsetX;
      const y = e.offsetY;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.strokeStyle = skinToneGrey;

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseout", stopDraw);
    canvas.addEventListener("mousemove", draw);

    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mouseup", stopDraw);
      canvas.removeEventListener("mouseout", stopDraw);
      canvas.removeEventListener("mousemove", draw);
    };
  }, [bwImage, brushSize]);

  const convertToBlackAndWhiteCanvas = (canvas: HTMLCanvasElement, img: HTMLImageElement) => {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'monochrome_mask.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleMonochromeMask = async () => {
    if (!image) return;
    const result = await monochromeMask({photoUrl: image});
    setMaskedImage(result.maskUrl);
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
            {image && bwImage ? (
              <canvas ref={canvasRef} className="border border-border rounded-md shadow-sm" />
            ) : (
              image ? (
                <div>Loading...</div>
              ) : (
                <div>Please upload an image.</div>
              )
            )}
          </div>

          <div className="w-full flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="brushSize" className="text-sm font-medium">Brush Size:</label>
              <Slider
                id="brushSize"
                min={5}
                max={50}
                step={1}
                defaultValue={[brushSize]}
                onValueChange={(value) => setBrushSize(value[0])}
                className="w-32"
              />
            </div>
            <Button onClick={handleDownload} disabled={!bwImage} className="bg-teal-500 text-teal-50 text-teal-50 hover:bg-teal-700">
              Download Image
            </Button>
          </div>
          <Button onClick={handleMonochromeMask} disabled={!image} className="bg-teal-500 text-teal-50 hover:bg-teal-700">
            Apply Monochrome Mask
          </Button>
          {maskedImage && (
            <img src={maskedImage} alt="Monochrome Masked Face" className="border border-border rounded-md shadow-sm" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
