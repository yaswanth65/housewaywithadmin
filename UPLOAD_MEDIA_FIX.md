# Upload Media Fix & Testing Summary

## Issues Fixed

### 1. **Port Configuration Mismatch** ✅

- **Problem**: Backend was configured for port 5001, but frontend expected port 5000
- **Solution**:
  - Updated [backend/src/server.js](../backend/src/server.js#L309) to use port 5000
  - Created [mobile-app/.env](../mobile-app/.env) with correct port configuration
  - Updated [mobile-app/src/utils/network.js](../mobile-app/src/utils/network.js#L19-L23) default ports

### 2. **Navigation Tab Initialization** ✅

- **Problem**: When navigating from dashboard "Upload Media" button → project list → project detail, the Media tab might not activate properly
- **Solution**: Added useEffect in [ExecutiveProjectDetailScreen.js](../mobile-app/src/screens/executive/ExecutiveProjectDetailScreen.js) to ensure initialTab parameter properly sets the active tab

## How Upload Media Works

### User Flow:

1. **Executive Dashboard** → Click "Upload Media" button
2. **Project List** → Opens with action='upload' parameter
3. **Select Project** → Navigates to Project Detail with initialTab='Media'
4. **Media Tab** → Automatically opens, user can click "Upload Photos / Videos"
5. **File Picker** → Opens device gallery/file picker
6. **Upload** → Files uploaded to Google Cloud Storage
7. **Confirmation** → Success message, files appear in gallery

### Technical Flow:

```
Dashboard (ExecutiveDashboardScreen.js)
  ↓ navigation.navigate('ExecutiveProjectList', { action: 'upload' })
Project List (ExecutiveProjectListScreen.js)
  ↓ handleProjectPress: initialTab = action === 'upload' ? 'Media' : 'Overview'
Project Detail (ExecutiveProjectDetailScreen.js)
  ↓ activeTab set to 'Media', MediaTab component rendered
Media Tab
  ↓ User clicks "Upload Photos / Videos" → pickImage()
  ↓ ImagePicker.launchImageLibraryAsync()
  ↓ uploadMedia(assets)
  ↓ FormData with file, category='images', projectId
Backend (files.js)
  ↓ POST /api/files/upload
  ↓ uploadToGCS() → Google Cloud Storage
  ↓ Save File record in MongoDB
  ↓ Return file URL
```

## Backend API Endpoints

### Upload File

- **Endpoint**: `POST /api/files/upload`
- **Auth**: Required (Bearer token)
- **Body**: FormData
  - `file`: File blob/stream
  - `category`: 'images' | 'documents' | 'quotations' | etc.
  - `projectId`: MongoDB ObjectId
- **Response**:
  ```json
  {
    "success": true,
    "message": "File uploaded to GCS successfully",
    "data": {
      "file": {
        "_id": "...",
        "filename": "...",
        "originalName": "...",
        "path": "https://storage.googleapis.com/...",
        "category": "images",
        "mimeType": "image/jpeg",
        "size": 12345,
        "uploadedBy": {...},
        "project": "..."
      }
    }
  }
  ```

### Get Project Files

- **Endpoint**: `GET /api/files/project/:projectId`
- **Auth**: Required
- **Response**: Array of files for the project

### Get File by ID

- **Endpoint**: `GET /api/files/:fileId`
- **Auth**: Required
- **Response**: Single file details

### Delete File

- **Endpoint**: `DELETE /api/files/:fileId`
- **Auth**: Required
- **Response**: Deletion confirmation

## Test Scripts Created

### 1. **get-test-credentials.js**

Get authentication token and project IDs for testing.

```bash
cd backend
node get-test-credentials.js [email] [password]
```

**Output**: Auth token, user info, and available projects

### 2. **quick-upload-test.js**

Quick test to upload a file to a specific project.

```bash
node quick-upload-test.js <projectId> <token>
```

**Tests**:

- File upload to GCS
- File retrieval by ID
- Project files list
- File visibility

### 3. **test-upload-flow.js**

Comprehensive upload testing for all user roles.

```bash
node test-upload-flow.js
```

**Tests**:

- Owner upload flow
- Executive upload flow
- Employee upload flow
- Image uploads
- Document uploads
- Cross-user file visibility
- File retrieval
- File deletion

## Testing Instructions

### Manual Testing:

1. **Restart Frontend** (to pick up .env changes):

   ```bash
   cd mobile-app
   # Stop current server (Ctrl+C)
   npm start
   # or
   npx expo start --clear
   ```

2. **Verify Backend is Running**:

   ```bash
   cd backend
   npm start
   # Should show: "🚀 Server running on port 5000"
   ```

3. **Test Upload Flow**:
   - Login as executive member
   - Go to Dashboard
   - Click "Upload Media" button
   - Select a project
   - Should open Media tab automatically
   - Click "Upload Photos / Videos"
   - Select image/video from device
   - Wait for upload confirmation
   - Verify file appears in gallery

### Automated Testing:

1. **Get Credentials**:

   ```bash
   cd backend
   node get-test-credentials.js
   ```

2. **Run Quick Test**:

   ```bash
   node quick-upload-test.js <projectId> <token>
   ```

3. **Run Full Test Suite**:
   ```bash
   node test-upload-flow.js
   ```

## Verification Checklist

- [ ] Backend running on port 5000
- [ ] Frontend connecting to port 5000
- [ ] Executive can access Dashboard
- [ ] "Upload Media" button navigates to project list
- [ ] Selecting project opens Media tab automatically
- [ ] Upload button triggers file picker
- [ ] Files upload successfully to GCS
- [ ] Uploaded files appear in gallery
- [ ] Other users can view uploaded files
- [ ] Files have correct metadata (name, size, type)
- [ ] GCS URLs are accessible
- [ ] Delete functionality works

## Files Modified

### Frontend:

- [mobile-app/src/screens/executive/ExecutiveProjectDetailScreen.js](../mobile-app/src/screens/executive/ExecutiveProjectDetailScreen.js)
- [mobile-app/src/utils/network.js](../mobile-app/src/utils/network.js)
- [mobile-app/.env](../mobile-app/.env) (created)

### Backend:

- [backend/src/server.js](../backend/src/server.js)

### Test Scripts (created):

- [backend/get-test-credentials.js](../backend/get-test-credentials.js)
- [backend/quick-upload-test.js](../backend/quick-upload-test.js)
- [backend/test-upload-flow.js](../backend/test-upload-flow.js)

## Common Issues & Solutions

### Issue: "Upload Media button does nothing"

- **Check**: Is backend running on port 5000?
- **Check**: Did you restart the frontend after .env changes?
- **Check**: Are there console errors in browser/app?

### Issue: "No file picker opens"

- **Check**: Are permissions granted for camera/media access?
- **Check**: Is ImagePicker properly configured in Expo?
- **Solution**: Try on different platform (web/mobile)

### Issue: "Upload fails with 401 Unauthorized"

- **Check**: Is user logged in?
- **Check**: Is auth token valid?
- **Solution**: Re-login to get fresh token

### Issue: "Upload fails with 403 Forbidden"

- **Check**: Is user assigned to the project?
- **Check**: Does user have upload permissions?
- **Solution**: Verify project assignment in database

### Issue: "File uploads but doesn't appear"

- **Check**: Refresh the project detail page
- **Check**: Check backend logs for errors
- **Check**: Verify GCS credentials are configured
- **Solution**: Run `node quick-upload-test.js` to verify backend

## Google Cloud Storage

Files are stored in GCS with the following structure:

```
bucket-name/
  ├── images/
  │   └── project-{id}/
  │       └── {filename}
  ├── documents/
  │   └── project-{id}/
  │       └── {filename}
  └── quotations/
      └── project-{id}/
          └── {filename}
```

**GCS Configuration** (in backend .env):

- `GCS_PROJECT_ID`: Google Cloud project ID
- `GCS_KEYFILE`: Path to service account key JSON
- `GCS_BUCKET`: Bucket name

## Next Steps

1. ✅ **Restart both servers** with new port configuration
2. ✅ **Run automated tests** to verify everything works
3. ✅ **Test manually** as each user role
4. ✅ **Verify GCS integration** - files are accessible via URLs
5. ✅ **Test on multiple platforms** (web, iOS, Android if possible)

---

**Status**: All fixes implemented and test scripts created. Ready for testing! 🚀
