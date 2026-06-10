# Manus Lovv Reference

Source page: https://lovvtravel-wazp5rtd.manus.space/

The deployed page does not expose the original TypeScript source or sourcemaps. The reference files in this folder were reconstructed from the public production bundle and visual page inspection, then cleaned up for readability.

## Files

- `Home.reconstructed.tsx`: reconstructed landing page component based on the deployed `client/src/pages/Home.tsx` bundle section.
- `index.tokens.css`: extracted design-token and utility layer summary from the deployed CSS bundle.

## Notes

- This is reference code, not wired into the current Lovv MVP app.
- Image URLs are remote CloudFront assets observed in the deployed bundle.
- The current local app already has onboarding, chat, and itinerary-result flows; use this reference selectively instead of replacing the current flow wholesale.
- If adopted into the app, split the work into small commits: design tokens, landing sections, destination cards, MVP flow, footer.
