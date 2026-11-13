import { expect, it } from 'vitest';
import { releasePlan } from '../../scripts/release-plan.mjs';
const budget = {
  productionDeploysUsed: 1,
  runtimeCreditsUsed: 0,
  usedCredits: 15,
  deploys: 1,
  futureDeploys: 1,
  runtimeForecast: 100,
  neonComputeUsed: 2,
  neonComputeEstimate: 1,
  neonStorageUsedGb: 0.1,
  neonStorageEstimateGb: 0.01,
  neonTransferUsedGb: 0.1,
  neonTransferEstimateGb: 0.01,
};
it('reserves remaining publishes and provider headroom without remote operations', () => {
  const result = releasePlan(budget);
  expect(result.withinPlanningCaps).toBe(true);
  expect(result.netlifyReserve).toBe(155);
});
it('rejects unknown budgets and flags forecasts beyond either provider cap', () => {
  expect(() => releasePlan({ ...budget, neonComputeUsed: null })).toThrow();
  expect(releasePlan({ ...budget, usedCredits: 200 }).withinPlanningCaps).toBe(false);
  expect(releasePlan({ ...budget, neonStorageEstimateGb: 1 }).withinPlanningCaps).toBe(false);
  expect(releasePlan({ ...budget, productionDeploysUsed: 4 }).withinPlanningCaps).toBe(false);
  expect(releasePlan({ ...budget, runtimeCreditsUsed: 90 }).withinPlanningCaps).toBe(false);
});
