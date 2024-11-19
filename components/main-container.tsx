"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { GoogleGenerativeAI } from "@google/generative-ai";
import jsPDF from 'jspdf'; 
import { marked } from 'marked';

type AnalysisTab = 'overview' | 'physical' | 'habitat' | 'collection' | 'scientific';

interface AnalysisData {
  overview?: {
    scientificName: string;
    commonName: string;
    order: string;
    family: string;
    identificationConfidence: string;
  };
  physical?: {
    size: {
      length: string;
      wingspan?: string;
    };
    colors: string[];
    features: string[];
    anatomy: Record<string, string>;
  };
  habitat?: {
    naturalHabitat: string;
    distribution: string[];
    behavior: string[];
    diet: string[];
  };
  collection?: {
    value: string;
    rarity: string;
    care: string[];
    handling: string[];
  };
  scientific?: {
    adaptations: string[];
    ecosystem: string;
    significance: string[];
    research: string[];
  };
}

export const MainContainer = () => {
  const [image, setImage] = useState<File | null>(null);
  const [capturedImageURL, setCapturedImageURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);
  const [cameraStarted, setCameraStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraStarted(true);
      setCapturedImageURL(null);
    } catch (error) {
      console.error("Camera access denied or unavailable:", error);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL("image/jpeg");
        setCapturedImageURL(dataURL);

        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        }

        fetch(dataURL)
          .then((res) => res.blob())
          .then((blob) => {
            setImage(new File([blob], "captured-image.jpg", { type: "image/jpeg" }));
          });
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setCapturedImageURL(URL.createObjectURL(e.target.files[0]));
      setCameraStarted(true);
    }
  };

  const parseAnalysisData = (markdownText: string): AnalysisData => {
    const data: AnalysisData = {
      overview: {
        scientificName: '',
        commonName: '',
        order: '',
        family: '',
        identificationConfidence: ''
      },
      physical: {
        size: {
          length: '',
          wingspan: ''
        },
        colors: [],
        features: [],
        anatomy: {}
      },
      habitat: {
        naturalHabitat: '',
        distribution: [],
        behavior: [],
        diet: []
      },
      collection: {
        value: '',
        rarity: '',
        care: [],
        handling: []
      },
      scientific: {
        adaptations: [],
        ecosystem: '',
        significance: [],
        research: []
      }
    };

    // Extract data from markdown text using regex
    const sections = markdownText.split('###').filter(Boolean);
    sections.forEach(section => {
      const lines = section.trim().split('\n');
      const title = lines[0].trim().toLowerCase();

      if (title.includes('taxonomic classification')) {
        lines.forEach(line => {
          if (line.includes('Scientific Name:')) data.overview!.scientificName = line.split(':')[1].trim();
          if (line.includes('Common Name')) data.overview!.commonName = line.split(':')[1].trim();
          if (line.includes('Order:')) data.overview!.order = line.split(':')[1].trim();
          if (line.includes('Family:')) data.overview!.family = line.split(':')[1].trim();
        });
      }
      // Add more section parsing as needed
    });

    return data;
  };

  const analyzeImage = async () => {
    if (!image) return;

    setLoading(true);
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY!);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    try {
      const imageParts = await fileToGenerativePart(image);
      const result = await model.generateContent([
        `As an expert entomologist, analyze this insect specimen and provide a detailed scientific report in the following structured format:

### Taxonomic Classification
- Scientific Name: [Genus species, indicate if tentative]
- Common Name(s): [List primary and alternative names]
- Order: [Taxonomic order]
- Family: [Taxonomic family]
- Identification Confidence: [High/Medium/Low with explanation]

### Morphological Analysis
- Body Measurements:
  * Total Length: [in mm]
  * Wingspan (if applicable): [in mm]
  * Other relevant measurements
- Coloration:
  * Primary colors
  * Patterns and markings
  * Seasonal/sexual dimorphism if apparent
- Key Features:
  * Head structure
  * Thorax characteristics
  * Abdominal features
  * Wing venation (if present)
  * Leg structure and adaptations
  * Antennae type and length
  * Specialized structures

### Ecological Profile
- Habitat Preferences:
  * Primary ecosystem type
  * Microhabitat requirements
  * Elevation range
- Geographic Distribution:
  * Native range
  * Current distribution
  * Migration patterns (if any)
- Behavioral Traits:
  * Activity patterns
  * Social behavior
  * Defense mechanisms
  * Mating system
- Diet and Feeding:
  * Food preferences
  * Feeding adaptations
  * Ecological role

### Collection & Preservation
- Specimen Value:
  * Market value range
  * Scientific importance
  * Collection significance
- Rarity Assessment:
  * Population status
  * Conservation status
  * Collection frequency
- Handling Guidelines:
  * Preservation methods
  * Storage requirements
  * Environmental controls
  * Special considerations

### Scientific Significance
- Evolutionary Adaptations:
  * Unique features
  * Survival strategies
  * Evolutionary history
- Ecosystem Role:
  * Ecological interactions
  * Environmental indicators
  * Ecosystem services
- Research Value:
  * Current studies
  * Research potential
  * Knowledge gaps

Provide precise, scientific details based on visible characteristics. Clearly indicate when information is inferred or uncertain. Use metric measurements and scientific terminology throughout.`,
        imageParts,
      ]);

      const response = await result.response;
      const text = response.text().trim();
      setResult(text);
      setAnalysisData(parseAnalysisData(text));

      const relatedQuestionsResult = await model.generateContent([
        `Based on the above insect analysis, generate 5 sophisticated questions that an entomologist or serious insect collector might ask about this specimen. Focus on:
- Advanced taxonomic details
- Specific morphological features
- Complex behavioral patterns
- Specialized collection techniques
- Ecological relationships
- Research implications

Format as clear, specific questions that would lead to detailed scientific discussions.`
      ]);

      const questionsResponse = await relatedQuestionsResult.response;
      const questions = questionsResponse
        .text()
        .trim()
        .split("\n")
        .map((q) => q.replace(/^\d+\.\s*/, "").trim())
        .slice(0, 5);

      setRelatedQuestions(questions);
    } catch (error) {
      console.error("Error analyzing image or generating questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRelatedQuestionClick = async (question: string) => {
    setLoading(true);
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY!);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    try {
      const result = await model.generateContent([
        `As an expert entomologist, provide a detailed, scientific answer to the following question about the previously analyzed insect specimen. Include relevant research citations where applicable: ${question}`
      ]);

      const response = await result.response;
      const answer = response.text().trim();
      setResult(answer);
    } catch (error) {
      console.error("Error generating answer:", error);
    } finally {
      setLoading(false);
    }
  };

  const fileToGenerativePart = async (file: File): Promise<{
    inlineData: { data: string; mimeType: string };
  }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(",")[1];
        resolve({
          inlineData: {
            data: base64Content,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const downloadPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("Insect Specimen Analysis Report", 105, 20, { align: "center" });
    
    // Add image if available
    if (capturedImageURL) {
      doc.addImage(capturedImageURL, "JPEG", 15, 30, 180, 100);
    }
    
    // Add content
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(result, 180);
    doc.text(lines, 15, capturedImageURL ? 140 : 40);
    
    // Add footer
    doc.setFontSize(10);
    doc.text("Generated by Insect Identifier", 105, 280, { align: "center" });
    doc.text(new Date().toLocaleDateString(), 105, 285, { align: "center" });
    
    doc.save("insect-analysis.pdf");
  };

  const renderTabContent = () => {
    if (!analysisData) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-semibold text-lg mb-2">Scientific Classification</h4>
                <p className="text-sm text-gray-600">{analysisData.overview?.scientificName}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-semibold text-lg mb-2">Common Name</h4>
                <p className="text-sm text-gray-600">{analysisData.overview?.commonName}</p>
              </div>
            </div>
            {/* Add more overview content */}
          </div>
        );
      // Add other tab cases
      default:
        return null;
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
            Analyze Your Insect
          </h2>
          <div className="mb-8">
            <label
              htmlFor="image-upload"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload an Image
            </label>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500"
            />
          </div>

          <button
            type="button"
            onClick={handleStartCamera}
            className="w-full bg-green-500 text-white py-3 px-4 rounded-lg mb-4"
          >
            Scan Image
          </button>
          <div className="mb-8">
            <video ref={videoRef} className="w-full max-h-64 rounded-md mb-4"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            {cameraStarted && (
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg"
              >
                Snap Image
              </button>
            )}
          </div>

          {capturedImageURL && cameraStarted && (
            <div className="mb-8 flex justify-center">
              <Image
                src={capturedImageURL}
                alt="Captured Image"
                width={300}
                height={300}
                className="rounded-lg shadow-md"
              />
            </div>
          )}

          <button
            type="button"
            onClick={analyzeImage}
            disabled={!image || loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg"
          >
            {loading ? "Analyzing..." : "Analyze Image"}
          </button>
        </div>

        {result && (
          <div className="bg-green-50 p-8 border-t border-green-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-800">Specimen Analysis</h3>
              <div className="flex space-x-2">
                {['overview', 'physical', 'habitat', 'collection', 'scientific'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as AnalysisTab)}
                    className={`px-4 py-2 rounded-lg ${
                      activeTab === tab
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 mb-6">
              {renderTabContent()}
            </div>

            <div className="prose prose-green max-w-none text-gray-800">
              <div dangerouslySetInnerHTML={{ __html: marked(result) }} />
            </div>

            {relatedQuestions.length > 0 && (
              <div className="mt-6 bg-white rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 text-green-700">Expert Questions</h4>
                <ul className="space-y-3">
                  {relatedQuestions.map((question, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        onClick={() => handleRelatedQuestionClick(question)}
                        className="text-left w-full p-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-800 transition-colors"
                      >
                        {question}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={downloadPDF}
                className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
              >
                Download Report
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
