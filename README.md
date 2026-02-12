# SIGAP GIZI - Implementation Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm atau yarn
- Supabase account (untuk backend)

### Installation Steps

1. **Replace Files**
   
   Copy semua file dari folder `sigap-gizi-redesign` ke project Anda:

   ```bash
   # Core files
   src/index.css                          → src/index.css
   src/main.jsx                           → src/main.jsx
   index.html                             → index.html
   vite.config.js                         → vite.config.js
   
   # Components
   src/components/navbar/DesktopNavbar.jsx → src/components/navbar/DesktopNavbar.jsx
   src/components/navbar/MobileNavbar.jsx  → src/components/navbar/MobileNavbar.jsx
   src/components/splash/TitleSection.jsx  → src/components/splash/TitleSection.jsx
   src/components/ChatWindow.jsx           → src/components/ChatWindow.jsx
   
   # New PERSAGI Pages
   src/pages/persagi/PersagiLoginPage.jsx  → src/pages/persagi/PersagiLoginPage.jsx (NEW)
   src/pages/persagi/PersagiDashboard.jsx  → src/pages/persagi/PersagiDashboard.jsx (NEW)
   ```

2. **Install Dependencies**

   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Supabase Setup**

   Pastikan Supabase sudah configured di `src/config/supabase.js`:
   
   ```javascript
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
   ```

   Create `.env` file:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Run Development Server**

   ```bash
   npm run dev
   # atau
   yarn dev
   ```

5. **Access Routes**

   - User App: http://localhost:5173/
   - Admin Panel: http://localhost:5173/admin
   - PERSAGI Portal: http://localhost:5173/persagi

## 📂 Folder Structure

Create folder baru jika belum ada:

```
src/
├── pages/
│   └── persagi/          ← Create this folder
│       ├── PersagiLoginPage.jsx
│       └── PersagiDashboard.jsx
```

## 🗄️ Database Requirements

### Tables yang diperlukan:

1. **dietitians**
   - id (uuid)
   - name (text)
   - photo_url (text)
   - is_online (boolean)
   - specialization (text)
   - ... other fields

2. **chat_sessions**
   - id (uuid)
   - user_guest_id (text)
   - dietitian_id (uuid, FK to dietitians)
   - status (text) - 'active', 'closed'
   - created_at (timestamp)
   - updated_at (timestamp)

3. **chat_messages**
   - id (uuid)
   - session_id (uuid, FK to chat_sessions)
   - sender_type (text) - 'user' atau 'dietitian'
   - message_text (text)
   - is_read (boolean)
   - created_at (timestamp)

### Create Tables (SQL):

```sql
-- Table: dietitians
CREATE TABLE dietitians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT,
  specialization TEXT,
  experience_years INTEGER,
  photo_url TEXT,
  is_online BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating DECIMAL(2,1) DEFAULT 5.0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: chat_sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_guest_id TEXT NOT NULL,
  dietitian_id UUID REFERENCES dietitians(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: chat_messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'dietitian')),
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Create indexes for performance
CREATE INDEX idx_chat_sessions_dietitian ON chat_sessions(dietitian_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
```

## 🔐 Authentication Setup

### Create PERSAGI User:

1. Di Supabase Dashboard → Authentication → Users
2. Create new user dengan email PERSAGI
3. Simpan credentials untuk login

### Row Level Security (RLS):

```sql
-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read sessions (untuk simplicity)
CREATE POLICY "Public read access" ON chat_sessions
  FOR SELECT USING (true);

-- Policy: Anyone can insert sessions
CREATE POLICY "Public insert access" ON chat_sessions
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can update sessions
CREATE POLICY "Public update access" ON chat_sessions
  FOR UPDATE USING (true);

-- Policy: Anyone can read messages
CREATE POLICY "Public read access" ON chat_messages
  FOR SELECT USING (true);

-- Policy: Anyone can insert messages
CREATE POLICY "Public insert access" ON chat_messages
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can update messages
CREATE POLICY "Public update access" ON chat_messages
  FOR UPDATE USING (true);
```

## 🎨 Customization

### Change Colors

Edit `index.css` untuk custom colors:

```css
/* Primary blue color */
.bg-blue-600 { background-color: #your-color; }
.text-blue-600 { color: #your-color; }
```

### Change Fonts

Edit `index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=YourFont:wght@400;500;600;700&display=swap');

@theme {
  --font-sans: "YourFont", ui-sans-serif, system-ui, sans-serif;
}
```

### Logo

Replace `src/assets/LOGORN.png` dengan logo Anda.

## 🧪 Testing

### Test User Flow:
1. Buka http://localhost:5173/
2. Navigate ke Konsultasi
3. Pilih dietitian → klik "Chat Sekarang"
4. Kirim pesan

### Test PERSAGI Flow:
1. Buka http://localhost:5173/persagi
2. Login dengan credentials PERSAGI
3. Lihat list sessions
4. Klik session → balas pesan
5. Verify real-time updates

## 📱 PWA Build

```bash
npm run build
# atau
yarn build
```

Deploy `dist/` folder ke hosting (Vercel, Netlify, dll).

## 🐛 Troubleshooting

### Issue: Font tidak load
**Solution**: Check internet connection, Google Fonts harus accessible

### Issue: Supabase connection error
**Solution**: 
- Verify `.env` file
- Check Supabase project status
- Verify API keys

### Issue: Real-time tidak bekerja
**Solution**:
- Enable Realtime di Supabase dashboard
- Check table publications
- Verify WebSocket connection

### Issue: Chat tidak muncul
**Solution**:
- Check browser console untuk errors
- Verify session creation
- Check Supabase tables

## 📋 Checklist Before Deploy

- [ ] All files copied correctly
- [ ] Dependencies installed
- [ ] Supabase configured
- [ ] Database tables created
- [ ] RLS policies set
- [ ] PERSAGI user created
- [ ] Tested in Chrome
- [ ] Tested in Safari
- [ ] Tested in Firefox
- [ ] Tested on mobile
- [ ] Tested on tablet
- [ ] PWA manifest correct
- [ ] Meta tags updated
- [ ] Logo replaced
- [ ] Colors customized (if needed)
- [ ] Fonts loaded
- [ ] Build successful

## 🎯 Next Steps

1. Replace files sesuai mapping di atas
2. Install dependencies
3. Setup Supabase
4. Test locally
5. Deploy to production

## 📞 Support

Jika ada issues:
1. Check console errors
2. Verify file paths
3. Check Supabase connection
4. Review documentation
5. Test in incognito mode
