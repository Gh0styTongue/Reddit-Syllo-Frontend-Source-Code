export type Share = { v: ShareVersion; code: string };
export type ShareVersion = 1;

// @ts-expect-error - Not sure but leaving it here!
const shareVersion: ShareVersion = 1;

export function getInviteCode(): string | undefined {
  const urlHash = window.location.hash;

  try {
    // 1. Remove the '#'
    const hashContent = urlHash.substring(1);

    // 2. URL-decode the string
    const decodedString = decodeURIComponent(hashContent);

    // 3. Parse the JSON string
    const data = JSON.parse(decodedString);

    // 4. Access the nested hash value
    const nestedHash = data.shareParam.hash;
    return nestedHash;
  } catch (error) {
    return undefined;
  }
}
