# Insect Identifier

An AI-powered web application that helps identify and analyze insects from images. Built with Next.js and Google's Gemini AI, this tool provides detailed entomological analysis of insect specimens.

## Features

- 📸 **Image Upload & Capture**: Upload insect images or capture them directly using your device's camera
- 🔍 **AI Analysis**: Powered by Google's Gemini AI for accurate insect identification
- 📋 **Detailed Reports**: Generates comprehensive analysis including:
  - Species Identification
  - Physical Characteristics
  - Behavior & Habitat
  - Conservation Status
  - Collector's Information
  - Interesting Facts
- 💭 **Expert Questions**: Generates relevant follow-up questions for deeper understanding
- 📑 **PDF Export**: Download analysis reports in PDF format
- 📱 **Responsive Design**: Works seamlessly across desktop and mobile devices

## Prerequisites

Before you begin, ensure you have:
- Node.js (18.x or later)
- npm or yarn package manager
- A Google Gemini API key ([Get it here](https://makersuite.google.com/app/apikey))

## Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd insect-identifier
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your Gemini API key:
```env
NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to use the application.

## Usage

1. **Upload or Capture Image**
   - Click "Upload an Image" to select an image file
   - Or use "Scan Image" to capture using your device's camera

2. **Analyze**
   - Click "Analyze Image" to process your insect specimen
   - Wait for the AI to generate the analysis

3. **View Results**
   - Review the detailed analysis
   - Explore expert follow-up questions
   - Download the report as PDF if needed

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [Google Generative AI](https://ai.google.dev/) - AI model for image analysis
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Marked](https://marked.js.org/) - Markdown processing
- [jsPDF](https://rawgit.com/MrRio/jsPDF/master/docs/) - PDF generation

## Project Structure

```
insect-identifier/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── header.tsx        # Navigation header
│   └── main-container.tsx # Main application logic
└── public/               # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
