// GitHub username rules: 1-39 chars, alphanumeric or single hyphens, cannot start/end with hyphen.
const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export function cleanGithubUsername(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^@/, "");
}

export function isValidGithubUsername(input: string): boolean {
  return GITHUB_USERNAME_REGEX.test(input);
}
