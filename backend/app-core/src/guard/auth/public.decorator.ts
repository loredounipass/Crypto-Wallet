import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route handler as public (no authentication required).
 * This signals to NestJS Doctor that the missing @UseGuards() is intentional.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
