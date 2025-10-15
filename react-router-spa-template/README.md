# ▶️ Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:3000`.

### Testing

Run the test suite in watch mode, this is probably what you want for most development work:

```bash
npm run test:watch
```

Check the coverage report:

```bash
npm run test:coverage
```

Run the test command that will run in CI:

```bash
npm run test
```

Perform a single run without watch mode:

```bash
npm run test:run
```

Enable Node.js inspector:

```bash
npm run test:debug
```

Update snapshots without having to press `u` after running the test suite:

```bash
npm run test:update-snapshots
```

### Linting and Formatting

Runs the formatter and the linter, and auto-fixes what it can:

```bash
npm run fix
```

Runs the formatter and the linter, no auto-fixes:

```bash
npm run fix:check
```

### Generate `schema.ts`

Learn more about `openapi-ts` and `openapi-fetch` in the [Type-safety and Data Fetching docs](docs/type-safety-and-data-fetching-architecture.md).

To generate the schema:

```bash
npm run generate:schema
```

# ⌨️ Additional Commands

### Building for Production

Create a production build:

```bash
npm run build
```

### Bundle Visualizer

Analyze your bundle by visualizing the dependencies:

```bash
npm run build:analyze
```

### Preview

Preview the output from `npm run build` on `http://localhost:4000`:

```bash
npm run preview
```

### Linting and Formatting [less commonly used options]

Runs *just* the formatter and auto-fixes what it can:

```bash
npm run format
```

Runs *just* the formatter without auto-fixes:

```bash
npm run format:check
```

Runs *just* the linter and auto-fixes what it can:

```bash
npm run lint
```

Runs *just* the linter without auto-fixes:

```bash
npm run lint:check
```

Generate React Router types and runs the TypeScript compiler to ensure no compile-time errors (`tsc`):

```bash
npm run typecheck
```
```