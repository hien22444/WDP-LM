# Authentication System - SignIn & SignUp

Complete authentication system with React, Redux, and SCSS.

## Features

- ✅ SignIn page with email/password authentication
- ✅ SignUp page with user registration
- ✅ Redux state management (useSelector, useDispatch)
- ✅ React Router navigation (useNavigate)
- ✅ Toast notifications (react-toastify)
- ✅ OAuth integration (Google, Facebook icons)
- ✅ Cookie-based token storage (js-cookie)
- ✅ SCSS styling with glassmorphism effects
- ✅ Form validation
- ✅ Loading states
- ✅ Responsive design

## Tech Stack

- **Frontend**: React (JavaScript, function components + hooks)
- **State Management**: Redux (@reduxjs/toolkit)
- **Routing**: react-router-dom
- **Notifications**: react-toastify
- **Icons**: react-icons (FaGoogle, FaFacebook)
- **Cookies**: js-cookie
- **Styling**: SCSS with variables and nested selectors
- **Build Tool**: Create React App

## Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Add your images to the `public` folder:
   - `signin-image.jpg` - Image for SignIn page right side
   - `signup-image.jpg` - Image for SignUp page right side

3. Start development server:
\`\`\`bash
npm start
\`\`\`

4. Build for production:
\`\`\`bash
npm run build
\`\`\`

## Project Structure

\`\`\`
src/
├── index.js                 # App entry point
├── App.js                   # Main app component with routes
├── pages/
│   ├── SignIn/
│   │   ├── SignIn.js       # SignIn component
│   │   └── SignIn.scss     # SignIn styles
│   ├── SignUp/
│   │   ├── SignUp.js       # SignUp component
│   │   └── SignUp.scss     # SignUp styles
│   └── Home/
│       ├── Home.js         # Home/Dashboard component
│       └── Home.scss       # Home styles
├── redux/
│   ├── store.js            # Redux store configuration
│   ├── slices/
│   │   └── userSlice.js    # User state slice
│   └── actions/
│       └── authActions.js  # Authentication actions
└── styles/
    └── global.scss         # Global styles
\`\`\`

## Backend API

The app expects a backend API at `http://localhost:8080/api/v1` with these endpoints:

### POST /auth/login
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

Response:
\`\`\`json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "account": {
      "email": "user@example.com",
      "role": "user"
    }
  }
}
\`\`\`

### POST /auth/register
\`\`\`json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

Response: Same as login

## Features Explained

### Redux State Management
- `useSelector` to access authentication state
- `useDispatch` to trigger login/register actions
- Automatic token storage in cookies

### Form Validation
- Email format validation
- Password minimum 8 characters
- Real-time form validation
- Disabled submit button when invalid

### Auto-Navigation
- Redirects to home when authenticated
- Redirects to signin when not authenticated

### Loading States
- Loading spinner during API calls
- Disabled inputs during loading
- Visual feedback for user actions

### SCSS Styling
- Glassmorphism effects
- CSS variables for colors
- Nested selectors
- Keyframe animations (fadeIn, rotate)
- Responsive design

## Customization

### Change API URL
Edit `src/redux/actions/authActions.js`:
\`\`\`javascript
const API_URL = 'YOUR_API_URL';
\`\`\`

### Change Colors
Edit SCSS variables in component files:
\`\`\`scss
$primary-color: #1e3a5f;
$link-color: #3b82f6;
// ... etc
\`\`\`

### Add More OAuth Providers
1. Import icon from react-icons
2. Add button in OAuth section
3. Create action in authActions.js

## Notes

- Images should be placed in `/public` folder
- Tokens are stored in cookies with 7-day (access) and 30-day (refresh) expiration
- Form uses button onClick instead of form onSubmit
- SCSS uses glassmorphism with backdrop-filter
