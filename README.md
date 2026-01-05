# Sales Helper

This is a React application built with Vite, designed to assist with sales and production comparison.

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd Sales-helper
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

## Deployment

This project is configured to deploy to **GitHub Pages** automatically using GitHub Actions.

### Setup
1. Go to your repository **Settings**.
2. Navigate to **low-code** > **Pages** (or just **Pages**).
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.

### Triggering Deployment
Deployment is triggered automatically when you push changes to the `main` branch.

## Project Structure

- `src/`: Source code including components and main application logic.
- `public/`: Static assets.
- `.github/workflows/`: CI/CD configurations.

## Notes
- This project uses `vite` for fast build and development.
- Ensure all environment variables (if any) are configured in GitHub Secrets for production deployment.
