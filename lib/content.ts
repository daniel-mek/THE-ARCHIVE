export const project = {
 title: 'JobScout', category: 'Software / Job discovery', year: 'Exhibit 001',
 summary: 'A workspace for discovering and tracking opportunities.',
 description: 'JobScout contains a Python job watcher and a Cloudflare Worker dashboard, alongside a newer Next.js and FastAPI application. This exhibit presents the original Scout dashboard screenshots included in the repository.',
 sections: [
 ['01 / Discovery', 'The repository documents collection of job postings, rule-based scoring, and alerts. The original dashboard presents scored postings and tracking controls.'],
 ['02 / Two generations', 'The legacy Scout interface uses a Cloudflare Worker and KV. The newer ApplyOS application uses Next.js and FastAPI with account, profile, discovery, matching, and application-tracking code. The screenshots above show the legacy interface.'],
 ['03 / Human control', 'The documented workflow keeps the final application submission with the user. No automatic application submission is claimed here.'],
 ['04 / Verification', 'UI screenshots and architecture descriptions come from the JobScout repository at snapshot 2519ea1. The application was not run end-to-end for this exhibit; performance, deployment, and hiring outcomes are unverified.']
 ]
};
