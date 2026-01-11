# 🧾 BiteWise - Accessible Health Insights

An accessibility-first receipt scanner that transforms grocery and restaurant receipts into personalized health insights. Built for **DeltaHacks** with a focus on making health information accessible to everyone.

## Project Overview

**Category Focus**: Best Accessibility Hack / Best Health Hack

Receipt Scanner helps users with visual impairments, dyslexia, ADHD, motor limitations, and cognitive challenges understand their food purchases and make healthier choices.

### The Problem
- Physical receipts are hard to read (small text, poor contrast, fading ink)
- People with disabilities struggle to track allergens and nutrition
- Health insights are often inaccessible to those whoc need them most

### Our Solution
- **Read-aloud mode**: Full receipt summaries with text-to-speech
- **High contrast & large text**: Customizable visual modes
- **Simple, error-tolerant UI**: Big buttons, minimal taps
- **Voice input**: Navigate hands-free (planned)
- **Smart health analysis**: AI-powered allergen detection and nutrition insights

## ✨ Features

### Accessibility
- Full screen reader support with ARIA labels
- Large text mode with scalable fonts
- Dark mode option
- Touch-friendly (44px+ tap targets)

### Health Insights
- Allergen alerts (dairy, nuts, gluten, etc.)
- Health score (0-100) with explanations
- Nutrition warnings (high sugar, sodium, etc.)
- Personalized suggestions
- Dietary profile tracking (vegan, vegetarian, etc.)

### Smart Receipt Processing
- OCR with Gemini Vision API
- Auto-detect store name and date
- Extract all items and prices
- Calculate return deadlines
- Store in MongoDB Atlas

### Sustainability
- Track digitized receipts (paper saved)
- Environmental impact insights

## Tech Stack

### Backend
- **FastAPI** - Python web framework
- **Gemini API** - Receipt OCR and health analysis
- **MongoDB Atlas** - Database for receipts and user data
- **Python** - Core language

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Web Speech API** - Text-to-speech and voice input
- **React Icons** - Accessible icons

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB Atlas account (free tier)
- Gemini API key (free from [ai.google.dev](https://ai.google.dev))

### Backend Setup

1. **Navigate to backend**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Run the server**
   ```bash
   python main.py
   ```
   Backend runs at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   Frontend runs at `http://localhost:3000`

### MongoDB Atlas Setup

1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create database: `receipt_scanner`
3. Add IP to network access
4. Copy connection string to `.env`

## 📱 How to Use

1. **Upload Receipt**
   - Take photo or upload image
   - Choose grocery or restaurant type

2. **Review Data**
   - Verify extracted items
   - Edit any mistakes
   - Add missed items

3. **Get Insights**
   - View allergen alerts
   - Check health score
   - Read personalized suggestions
   - Use "Read Aloud" for audio

4. **Track Progress**
   - Dashboard shows trends
   - Return deadline tracking
   - Sustainability metrics

## 🎨 Accessibility Toolbar

Located at the top of every page:

- **Large Text**: 1.25x larger fonts throughout
- **Dark Mode**: Reduce eye strain

All settings saved to localStorage.

## 🔧 Development

### Project Structure
```
DeltaHACKSrealREHAN/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── database.py          # MongoDB operations
│   ├── gemini_service.py    # AI integration
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Landing
│   │   ├── upload/          # Upload page
│   │   ├── review/          # Review page
│   │   ├── results/         # Results page
│   │   └── dashboard/       # Dashboard
│   ├── components/
│   │   └── AccessibilityToolbar.tsx
│   └── README.md
└── README.md (this file)
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| POST | `/api/receipts/upload` | Upload receipt image |
| POST | `/api/receipts/analyze` | Analyze for health |
| GET | `/api/receipts` | List all receipts |
| GET | `/api/receipts/{id}` | Get single receipt |
| GET | `/api/dashboard/stats` | Dashboard data |
| POST | `/api/text-to-speech` | Convert to audio |
| POST | `/api/user/profile` | Update preferences |

## 🧪 Testing

### Accessibility Testing
```bash
# Install Lighthouse
npm install -g lighthouse

# Run accessibility audit
lighthouse http://localhost:3000 --only-categories=accessibility --view
```

### Manual Testing
- Screen readers: NVDA, JAWS, VoiceOver
- Keyboard-only navigation
- Color contrast checker
- Mobile touch targets


## 📄 License

MIT License - Free for all to use and modify


## 👥 Team

Built for DeltaHacks 2026


## 🙏 Acknowledgments

- **Google Gemini** - AI-powered OCR and analysis
- **MongoDB Atlas** - Database platform
- **MLH** - Hackathon support and API access
