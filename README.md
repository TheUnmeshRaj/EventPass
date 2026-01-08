# EventPass - Secure Event Ticketing System

EventPass is a modern event ticketing platform that uses **Next.js** for the frontend and **Flask** for the backend, integrated with **DeepFace** for biometric identity verification and **Supabase** for secure data storage.

## Features

- **Biometric Identity Verification**: Uses face recognition (DeepFace) to link tickets to actual users, preventing unauthorized resale.
- **Real-time Marketplace**: Browse and purchase tickets for various events.
- **Secure Wallet**: Manage your tickets and view transaction history via a ledger.
- **Admin Dashboard**: Create and manage events (Admin only).
- **Venue Scanner**: QR code based entry with real-time face verification.

## Tech Stack

- **Frontend**: Next.js 16, Tailwind CSS, Framer Motion
- **Backend**: Flask, DeepFace, Gunicorn
- **Database**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel (Frontend), HuggingFace (Backend)

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- Supabase Account

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/TheUnmeshRaj/EventPass.git
   cd EventPass
   ```

2. **Frontend Setup**:
   ```bash
   cd clientside
   npm install
   ```
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

3. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   pip install -r requirements.txt
   ```

   or what i prefer

   ```bash
   cd backend
   conda create -n eventpass python=3.10 -y
   conda activate eventpass
   pip install -r requirements.txt
   ```

   Create a `.env` file in the `backend` directory with:

   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key
   ```
   you will find these in the service role section in supabase

   
## Authors

- **Unmesh Raj**
- **Aditya K**
- **Aditya Ranjan**

---
Built with ❤️ at RVCE AIML Department.