# Data Directory

This directory contains JSON data files for bulk imports.

## Files

- `questions_12sinif_problemler.json` - 20 problem questions for 12th grade math
  - 10 hard questions
  - 5 medium questions
  - 5 easy questions

## Usage

```typescript
import questionsData from './data/questions_12sinif_problemler.json';
import { bulkImportQuestions } from './utils/importQuestions';

const result = await bulkImportQuestions(
  questionsData,
  'your-institution-id',
  'your-user-id'
);
```

See `QUICK_START.md` for detailed import instructions.
