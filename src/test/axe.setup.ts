// Регистрирует матчер `toHaveNoViolations` (jest-axe) для всех тестов.
// Подключается через vitest.config.ts → test.setupFiles.
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
