# @gradientedge/cdk-utils-common

Common shared utilities used across all `@gradientedge/cdk-utils` packages.

## Overview

This package provides:

- **Enums** — stage definitions (DEV, TEST, UAT, PROD) and environment types
- **Interfaces** — shared type definitions for common properties
- **Constants** — stage checking utilities and helper functions

## Installation

```bash
pnpm add @gradientedge/cdk-utils-common
```

## Usage

```typescript
import { Stage, isDevStage, isPrdStage } from '@gradientedge/cdk-utils-common'

if (isDevStage(currentStage)) {
  // Development-specific configuration
}
```
