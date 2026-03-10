/**
 * Frontend Build Script
 * Compiles TypeScript page files and bundles them with HTML
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_SRC = path.join(__dirname, '../frontend/src');
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');
const FRONTEND_PUBLIC = path.join(__dirname, '../frontend');

async function buildFrontend() {
  try {
    console.log('🚀 Starting frontend build...\n');

    // Step 1: Clean dist directory
    console.log('📦 Cleaning dist directory...');
    await fs.emptyDir(FRONTEND_DIST);

    // Step 2: Compile and Bundle with esbuild
    console.log('⚙️  Bundling frontend with esbuild...');
    const esbuild = require('esbuild');

    await esbuild.build({
      entryPoints: [path.join(FRONTEND_SRC, 'app.ts')],
      bundle: true,
      minify: true,
      sourcemap: true,
      outfile: path.join(FRONTEND_DIST, 'app.bundle.js'),
      platform: 'browser',
      target: ['es2020'],
    });
    console.log('✓ Frontend bundling successful\n');

    // Step 3: Copy index.html
    console.log('📄 Copying index.html...');
    const indexSrc = path.join(FRONTEND_PUBLIC, 'index.html');
    const indexDest = path.join(FRONTEND_DIST, 'index.html');

    if (fs.existsSync(indexSrc)) {
      await fs.copy(indexSrc, indexDest);
      console.log('  ✓ index.html copied');
    }

    // Step 4: Styles are handled by the separate build:css command
    console.log('✅ Frontend build completed successfully!');
    console.log(`Output directory: ${FRONTEND_DIST}/`);
  } catch (error) {
    console.error('❌ Frontend build failed:', error.message);
    process.exit(1);
  }
}

// Run build
buildFrontend();
