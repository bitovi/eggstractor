import type { GitProvider } from '@eggstractor/common';

export interface ProviderLabels {
  providerLabel: string;
  repoLabel: string;
  repoHint: string;
  repoLinkHref: string;
  tokenLabel: string;
  tokenLinkHref: string;
}

export function useProviderLabels(provider: GitProvider): ProviderLabels {
  const providerLabel = provider === 'github' ? 'GitHub' : 'GitLab';
  const repoLabel = provider === 'github' ? 'GitHub repository' : 'GitLab project';
  const repoHint =
    provider === 'github' ? 'e.g., levi-myers/eggstractor-demo' : 'e.g., username/project-name';
  const repoLinkHref =
    provider === 'github'
      ? 'https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories'
      : 'https://docs.gitlab.com/ee/user/project/';
  const tokenLabel = `${providerLabel} token`;
  const tokenLinkHref =
    provider === 'github'
      ? 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token'
      : 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html';

  return {
    providerLabel,
    repoLabel,
    repoHint,
    repoLinkHref,
    tokenLabel,
    tokenLinkHref,
  };
}
