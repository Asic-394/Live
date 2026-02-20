/**
 * Minimal className merger utility
 * Combines multiple class names, filtering out falsy values
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}
