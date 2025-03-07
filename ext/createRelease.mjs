import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

(async () => {
    try {
        const response = await octokit.repos.createRelease({
            owner: process.env.GITHUB_REPOSITORY_OWNER,
            repo: process.env.GITHUB_REPOSITORY.split('/')[1],
            tag_name: `v${process.env.GITHUB_RUN_NUMBER}`,
            name: `Release v${process.env.GITHUB_RUN_NUMBER}`,
            draft: false,
            prerelease: false,
        });
        console.log('Release created:', response.data);
        console.log('Upload URL:', response.data.upload_url);
    } catch (error) {
        console.error('Error creating release:', error);
        process.exit(1);
    }
})();
