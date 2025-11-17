# Getting Started with React TypeScript Template

## What is This?

This is a template repository - a boilerplate starter project for building React applications with TypeScript and Tailwind CSS. It's designed to be used as a starting point for new projects, not as a project you contribute to directly.

**Important: This repository is read-only. You cannot and should not push changes to this template. Instead, you'll create your own copy to work with.**

## How to Use This Template

### Step 1: Use GitHub's Template Feature

1. **Click the "Use this template" button** on the GitHub repository page
   - You'll find this button at the top right of the repository page
   - Select "Create a new repository"

2. **Configure your new repository:**
   - Choose a name for your new repository (e.g., `my-awesome-app`)
   - Select the owner (your GitHub account or organization)
   - Choose visibility (public or private)
   - Do NOT initialize with README, .gitignore, or license (this template already includes them)
   - Click "Create repository" - GitHub will create a new repository with all the template code

3. **Copy the repository URL** from your newly created repository page (e.g., `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`)

### Step 2: Clone in Your Preferred IDE

#### WebStorm / IntelliJ IDEA

1. Open WebStorm/IntelliJ IDEA
2. Select **"Get from VCS"** (or File → New → Project from Version Control)
3. Paste the repository URL you copied in Step 1
4. Choose a directory where you want to clone the project
5. Click **"Clone"** - WebStorm will clone the repository and automatically detect it as a Node.js project
6. Wait for npm to install dependencies automatically (or run `npm install` manually)

#### Visual Studio Code

1. Open Visual Studio Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type **"Git: Clone"** and select it
4. Paste the repository URL you copied in Step 1
5. Choose a directory to clone into
6. Click **"Open"** when prompted to open the cloned folder
7. Open the integrated terminal and run `npm install` to install dependencies

## Next Steps After Creating Your Repository

Once you have your own copy of the template, follow these steps:

### Step 1: Install Dependencies

Install all required npm packages:

```bash
npm install
```

This will install:
- React and React DOM
- TypeScript
- Tailwind CSS and PostCSS
- Testing libraries
- All other dependencies listed in `package.json`

### Step 2: Configure API Endpoint (If Needed)

If you're connecting to a backend API, update the API base URL:

1. **Edit `src/services/api.ts`:**
   - Change `API_BASE_URL` from `http://localhost:8080/api` to your backend URL
   - Update any other API configuration as needed

### Step 3: Run the Application

Start the development server:

```bash
npm start
```

The application will start on [http://localhost:3000](http://localhost:3000) and automatically open in your browser.

The page will reload automatically when you make changes to the code.

### Step 4: Test the Demo Dashboard (Optional)

This template includes a demo dashboard page that demonstrates how to make API calls to a backend service. This is a learning example and should be removed once you start building your actual application.

**What it does:**
- Displays a form asking "Hi, what's your name?"
- Allows the user to enter their name in a text input field
- Sends a POST request to `http://localhost:8080/api/hello` with a JSON body matching the `HelloWorldDto` structure (`{ "name": "..." }`)
- Displays the response message from the backend server

**To test it:**

1. **Start your backend server** - Ensure your backend API is running on `http://localhost:8080` with an endpoint at `/api/hello` that accepts POST requests with a `HelloWorldDto` body.

2. **The React app should already be running** from Step 4 - Navigate to [http://localhost:3000](http://localhost:3000)

3. **Test the form** - Enter your name and click "Send" to see the API response.

**Note:** This demo dashboard is included as a learning example to help you understand:
- How to structure TypeScript interfaces/DTOs
- How to create API service functions
- How to build React components with form handling and API integration
- How to handle loading states and errors
- How to use Tailwind CSS for styling

Once you understand how it works, you should remove the demo code and create your own application components.

### Step 5: Remove the Demo Code

When you're ready to start building your actual application, remove the demo dashboard code:

1. **Delete the demo files:**
   - `src/pages/Dashboard.tsx`
   - `src/services/api.ts` (if you don't need the API service structure)
   - `src/types/dto.ts` (if you don't need the DTO structure)

2. **Update `src/App.tsx`** - Replace the Dashboard import and usage with your own application components:
   ```tsx
   import React from 'react';
   import YourComponent from './components/YourComponent';
   
   function App() {
     return <YourComponent />;
   }
   
   export default App;
   ```

3. **Optional:** Keep the folder structure (`src/pages/`, `src/services/`, `src/types/`) as a reference for organizing your own code, or remove them if you prefer a different structure.

## Understanding the Template Structure

This template includes:

- **Demo Dashboard** (`src/pages/Dashboard.tsx`) - Example React component showing how to create forms, handle state, and make API calls (should be deleted after learning)
- **API Service** (`src/services/api.ts`) - Example service function showing how to structure API calls
- **TypeScript DTOs** (`src/types/dto.ts`) - Example TypeScript interface matching a backend DTO structure
- **Tailwind CSS** - Pre-configured utility-first CSS framework for styling
- **TypeScript Configuration** - Strict TypeScript setup with proper type checking
- **Testing Setup** - Jest and React Testing Library configured and ready to use
- **Standard folder structure** - Organized structure for pages, components, services, and types

### Project Structure

```
src/
├── pages/          # Page components (e.g., Dashboard.tsx)
├── services/       # API service functions
├── types/          # TypeScript interfaces and types
├── App.tsx         # Main app component
├── index.tsx       # Application entry point
└── index.css       # Global styles with Tailwind directives
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload automatically when you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Important Notes

- **This is a template** - Don't try to contribute changes back to this repository
- **Create your own repository** - Always work from your own copy
- **Demo code** - The dashboard example is for learning purposes and should be removed when you start building your actual application
- **API Configuration** - Update the API base URL in `src/services/api.ts` to match your backend
- **Tailwind CSS** - Already configured and ready to use. See [Tailwind CSS documentation](https://tailwindcss.com/docs) for usage
- **TypeScript** - Strict mode is enabled. See [TypeScript documentation](https://www.typescriptlang.org/docs/) for more information

## Need Help?

- Check the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- Review the [React documentation](https://reactjs.org/)
- Check the [TypeScript documentation](https://www.typescriptlang.org/docs/)
- See the [Tailwind CSS documentation](https://tailwindcss.com/docs)
- Review the inline code comments in the demo files for guidance

## Contributing

Do not contribute to this template repository. This is a read-only template. If you have improvements or suggestions, please create an issue in your own fork or contact the template maintainers.
