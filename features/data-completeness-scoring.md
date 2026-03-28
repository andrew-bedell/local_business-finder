# Data Completeness Scoring

## Summary
Calculates a 0-100 score representing how much data has been gathered for each business. Shown as a popup before website creation so the operator can see what data is available and what's missing.

## Details
- Weighted scoring across 7-8 criteria (menu only for food businesses)
- Score displayed in a popup before website generation with per-item checklist
- Items show checkmark (full), half-circle (partial), or X (missing) with point breakdown
- Three tiers: green (70+), yellow (40-69), red (<40) with contextual message
- Score saved to `data_completeness_score` column on `businesses` table
- Popup appears for both new websites and regenerations
- User can proceed or cancel based on the score

## Scoring Criteria
| Criteria | Max Points | Thresholds |
|---|---|---|
| Photos (excludes text-overlay) | 20 | 1+ = 5, 3+ = 20 |
| Reviews | 20 | 1+ = 10, 5+ = 20 |
| Social Profiles | 15 | 1 = 7, 2+ = 15 |
| Contact Info | 10 | phone = 5, email/whatsapp = 5 |
| Operating Hours | 10 | present = 10 |
| Business Description | 10 | present = 10 |
| Category | 5 | present = 5 |
| Menu Data (food only) | 10 | 1+ = 5, 3+ = 10 |

## Key Files
- `employee/admin.js` — `calculateCompleteness()`, `showCompletenessPopup()`, `handleCreateWebsite()`
- `whatsapp-bridge/compile-business-data.js` — `calculateCompleteness()` (WhatsApp pipeline variant)
