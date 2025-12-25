# EventPass Face Recognition - Troubleshooting Guide

## Common Issues & Solutions

### 1. Backend Connection Issues

#### Problem: "Cannot connect to backend at http://localhost:8000"

**Symptoms:**
- Frontend shows error when capturing face
- Network error in browser console
- API calls fail

**Solutions:**

1. **Check if backend is running:**
   ```bash
   # Terminal 1 - Check if process is running
   curl http://localhost:8000/api/health
   
   # Expected response:
   # {"status": "healthy", "service": "deepface-api"}
   ```

2. **Restart the backend:**
   ```bash
   cd facerecog
   
   # Make sure virtual environment is activated
   venv\Scripts\activate
   
   # Kill existing process (if any)
   # Ctrl+C in the terminal running the server
   
   # Start fresh
   python main.py
   ```

3. **Verify CORS_ORIGINS in .env:**
   ```
   CORS_ORIGINS=http://localhost:3000
   ```
   Restart after changing.

4. **Check firewall:**
   - Windows: Check Windows Defender Firewall
   - Ensure port 8000 is allowed for Python

#### Problem: "CORS error: Access denied"

**Symptoms:**
- Browser console shows CORS error
- Request fails before reaching backend

**Solutions:**

1. **Update backend CORS settings:**
   ```python
   # In facerecog/.env
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

2. **Restart backend after changing:**
   ```bash
   # Kill the server (Ctrl+C)
   # Run again: python main.py
   ```

3. **Check frontend URL:**
   - Must match exactly (including port)
   - No trailing slashes

### 2. Face Detection Issues

#### Problem: "Face detection failed" error

**Symptoms:**
- Backend returns 400 error
- Message: "Face detection failed: ..."

**Solutions:**

1. **Improve image quality:**
   - ✓ Good lighting (face well-lit)
   - ✓ Clear focus (face in focus, not blurry)
   - ✓ Full face visible (not cut off)
   - ✓ Neutral expression (mouth closed recommended)
   - ✗ Avoid: Sunglasses, hats, heavy makeup

2. **Check image size:**
   - Minimum: 100x100 pixels
   - Maximum: 8000x8000 pixels
   - Recommended: Face occupies 20-70% of image

3. **Test with static image:**
   ```bash
   curl -X POST "http://localhost:8000/api/verify-face" \
     -F "file=@test_face.jpg"
   ```

4. **Check camera resolution:**
   - Camera should capture at least 720p
   - Check browser camera settings

### 3. Camera Permission Issues

#### Problem: "Unable to access camera"

**Symptoms:**
- FaceScanner doesn't show video
- Permission prompt appears but clicking allow doesn't work
- Error message: "Unable to access camera"

**Solutions:**

1. **Chrome/Edge - Check permissions:**
   - Click camera icon in address bar
   - Check "Always allow localhost:3000"
   - Reload page

2. **Firefox - Enable camera access:**
   - Type `about:preferences#privacy`
   - Find "Permissions" → "Camera"
   - Ensure localhost:3000 is NOT blocked

3. **Windows - System permissions:**
   - Settings → Privacy & Security → Camera
   - Allow "Camera" for "Google Chrome" or "Microsoft Edge"

4. **Use HTTPS in production:**
   - Browsers require HTTPS for camera access
   - Use localhost:3000 for development (allowed)

5. **Test with different browser:**
   - Try Chrome, Firefox, Edge, Safari
   - Some browsers have stricter permissions

#### Problem: "Camera not found" or "No camera detected"

**Solutions:**

1. **Check physical camera:**
   - Verify camera is connected (laptop/external)
   - Check if other apps can access it

2. **Restart browser:**
   ```bash
   # Close all instances of the browser
   # Open fresh
   ```

3. **Check system camera:**
   ```bash
   # Windows: Settings → Camera → App permissions
   # Ensure the browser is allowed
   ```

### 4. Face Verification Issues

#### Problem: "No matching face found" (correct user not recognized)

**Symptoms:**
- Registered user's face not recognized
- Always shows "Face not recognized"

**Solutions:**

1. **Check registration:**
   - Ensure face was registered in database
   - Check Supabase: face_images table has entries
   - Verify face_url is accessible

2. **Check image quality consistency:**
   - Register and verify should have similar conditions
   - Try registering from different angles
   - Ensure adequate lighting both times

3. **Adjust verification threshold:**
   In facerecog/main.py:
   ```python
   threshold = 0.6  # Try reducing to 0.55 or 0.5
   ```
   Restart backend and try again.

4. **Check distance values:**
   - Log the returned distance in API response
   - If consistently just above 0.6, lower threshold

#### Problem: "Match found but confidence is low"

**Symptoms:**
- Face recognized but confidence < 50%
- Unreliable verification

**Solutions:**

1. **Improve image quality:**
   - Better lighting
   - Higher camera resolution
   - Clearer face visibility

2. **Register additional face angles:**
   - Front-facing (primary)
   - Slight left tilt
   - Slight right tilt
   - This improves match robustness

3. **Check for consistency:**
   - Avoid major changes in lighting
   - Similar background is helpful
   - Consistent camera distance

### 5. Database Issues

#### Problem: "Failed to log verification" or database errors

**Symptoms:**
- Verification succeeds but logging fails
- Supabase connection errors

**Solutions:**

1. **Check Supabase connection:**
   ```bash
   # Verify credentials in clientside/.env.local
   NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

2. **Verify tables exist:**
   - Supabase Dashboard → SQL Editor
   - Run: `SELECT * FROM face_images LIMIT 1;`
   - If error, run database_schema.sql

3. **Check RLS policies:**
   - Supabase Dashboard → Authentication → Policies
   - Verify face_images table has correct policies
   - Ensure user is authenticated

4. **Test Supabase connection:**
   ```javascript
   // In browser console:
   import { createClient } from '@supabase/supabase-js';
   const client = createClient(url, key);
   const { data, error } = await client.auth.getSession();
   console.log(data, error);
   ```

#### Problem: "Storage bucket not found" or upload fails

**Symptoms:**
- Face image upload fails
- Error: "Bucket not found: face-images"

**Solutions:**

1. **Create bucket in Supabase:**
   - Dashboard → Storage
   - Click "New bucket"
   - Name: `face-images`
   - Set to public
   - Click "Create bucket"

2. **Verify bucket permissions:**
   - Select bucket → Policies
   - Ensure authenticated users can upload:
     ```sql
     CREATE POLICY "Users can upload"
     ON storage.objects
     FOR INSERT
     WITH CHECK (auth.role() = 'authenticated');
     ```

3. **Check bucket is public:**
   - Storage → face-images → Settings
   - "Access Settings" → Public

### 6. Performance Issues

#### Problem: Verification takes too long (>5 seconds)

**Symptoms:**
- Slow response from backend
- Long "Processing..." state

**Solutions:**

1. **First run model download:**
   - First request downloads ~170MB model
   - This is normal, takes 1-3 minutes
   - Subsequent requests use cached model
   - Solution: Wait for first run to complete

2. **Check server resources:**
   ```bash
   # Monitor CPU/Memory usage
   # Python process should use <30% CPU
   # If higher, model is still loading
   ```

3. **Optimize image size:**
   - Smaller images process faster
   - Target: 100-200 KB JPEG
   - Current: 300 KB+ is slow

4. **Check network:**
   - Slow network = slow API calls
   - Test with: `curl http://localhost:8000/api/health`
   - Should respond instantly

5. **Enable GPU (advanced):**
   - If available, TensorFlow uses GPU
   - Install: `pip install tensorflow[and-cuda]`
   - ~5x speedup possible

### 7. Frontend Display Issues

#### Problem: "Capture Face button" doesn't work or appears disabled

**Symptoms:**
- Button is grayed out
- Clicking does nothing

**Solutions:**

1. **Check camera is ready:**
   - Wait for webcam feed to appear
   - Video should show live feed
   - Wait 1-2 seconds after page loads

2. **Check browser console errors:**
   - Open DevTools: F12
   - Go to Console tab
   - Look for red errors
   - Note the error message

3. **Allow camera permission:**
   - Browser permission prompt
   - Select "Allow"
   - Reload page

4. **Check loading state:**
   - If "Processing..." is stuck
   - Restart frontend: `npm run dev`

#### Problem: Verification result doesn't display

**Symptoms:**
- No result shown after face capture
- Page appears stuck

**Solutions:**

1. **Check browser console:**
   - F12 → Console tab
   - Look for errors
   - Common: "undefined state"

2. **Restart frontend:**
   ```bash
   # Terminal: Ctrl+C
   npm run dev
   ```

3. **Clear browser cache:**
   - DevTools → Application → Clear Site Data
   - Reload page

4. **Check backend response:**
   - Open DevTools Network tab
   - Capture face
   - Click on /api/verify-face request
   - Check Response tab
   - Verify JSON structure

### 8. Environment Configuration Issues

#### Problem: "Environment variable is undefined"

**Symptoms:**
- Backend can't connect to database
- API URL is blank
- Error: "undefined" in logs

**Solutions:**

1. **Check .env files exist:**
   ```bash
   # Frontend
   ls clientside/.env.local
   
   # Backend
   ls facerecog/.env
   ```

2. **Verify file content:**
   ```bash
   # Frontend - Should have:
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_DEEPFACE_API_URL=http://localhost:8000
   
   # Backend - Should have:
   API_HOST=0.0.0.0
   API_PORT=8000
   CORS_ORIGINS=http://localhost:3000
   ```

3. **Restart after changing .env:**
   - Kill process: Ctrl+C
   - Start fresh: `npm run dev` or `python main.py`

4. **Check variable names:**
   - Must match exactly (case-sensitive)
   - No spaces around `=`
   - No quotes around values

### 9. Model Loading Issues

#### Problem: Backend crashes on first request

**Symptoms:**
- Process exits
- Error: "Unable to load model" or CUDA errors
- Out of memory error

**Solutions:**

1. **Check disk space:**
   - Need ~500MB free for models
   - Models cache in: `~/.deepface/weights/`

2. **Check RAM:**
   - Minimum: 4GB RAM
   - Recommended: 8GB+ RAM
   - Check: `Ctrl+Shift+Esc` → Task Manager

3. **Install CPU-only TensorFlow:**
   ```bash
   pip uninstall tensorflow tensorflow-gpu
   pip install tensorflow==2.14.0
   ```

4. **Run with more memory:**
   ```bash
   python -c "import resource; resource.setrlimit(resource.RLIMIT_AS, (-1, -1))"
   python main.py
   ```

5. **Use alternative model:**
   In facerecog/main.py:
   ```python
   embedding = DeepFace.represent(image, model_name="VGGFace", enforce_detection=True)
   # VGGFace is smaller but less accurate
   ```

### 10. Testing Issues

#### Problem: Manual API testing fails (curl commands)

**Symptoms:**
- curl returns error
- Connection refused
- Invalid response

**Solutions:**

1. **Verify backend is running:**
   ```bash
   curl http://localhost:8000/api/health
   # Should return: {"status":"healthy","service":"deepface-api"}
   ```

2. **Check image file:**
   ```bash
   # File must exist
   ls -la test_image.jpg
   
   # Or use a test endpoint
   curl -X POST http://localhost:8000/api/health
   ```

3. **Use correct Content-Type:**
   ```bash
   # Should NOT specify Content-Type, let curl detect it
   curl -X POST "http://localhost:8000/api/verify-face" \
     -F "file=@image.jpg"
   ```

4. **Check response:**
   ```bash
   # Add verbose flag
   curl -v -X POST "http://localhost:8000/api/verify-face" \
     -F "file=@image.jpg"
   ```

## Debug Checklist

When something doesn't work, go through this:

- [ ] Backend running? `curl http://localhost:8000/api/health`
- [ ] Frontend running? `npm run dev` in clientside/
- [ ] Browser at http://localhost:3000?
- [ ] Supabase credentials in .env.local?
- [ ] Camera permissions granted?
- [ ] Face clearly visible in good lighting?
- [ ] Database tables created? Check Supabase
- [ ] Storage bucket created? Check Supabase Storage
- [ ] Browser console for errors? F12 → Console
- [ ] Network tab for API response? F12 → Network

## Getting Help

1. **Check the logs:**
   - Backend: Look at terminal output
   - Frontend: F12 → Console tab
   - Supabase: Dashboard → Logs

2. **Review documentation:**
   - FACE_RECOGNITION_INTEGRATION.md
   - QUICK_REFERENCE.md
   - ARCHITECTURE.md

3. **Search for the error:**
   - Google the exact error message
   - GitHub issues for the library
   - StackOverflow

4. **Minimal test:**
   - Test API directly: `curl` command
   - Test frontend separately
   - Test database query separately

## Performance Monitoring

To check if everything is working well:

```bash
# Backend performance
# Check logs for response times
# Should be < 2 seconds per request

# Frontend performance
# DevTools → Network tab
# Check request size and time
# Should be < 500KB payload

# Database
# Supabase Dashboard → Logs
# Check for slow queries
```

---

**Last Updated:** December 22, 2025
**Version:** 1.0

For additional help, refer to:
- [DeepFace GitHub](https://github.com/serengp/deepface)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Supabase Docs](https://supabase.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
