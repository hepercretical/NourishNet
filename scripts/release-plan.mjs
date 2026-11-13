import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Planning only: this command never deploys, applies SQL, or loads credentials.
export function releasePlan(input) {
  const {
    usedCredits,
    deploys = 1,
    futureDeploys,
    runtimeForecast,
    otherReservedCredits = 0,
    productionDeploysUsed,
    runtimeCreditsUsed,
    neonComputeUsed,
    neonComputeEstimate,
    neonStorageUsedGb,
    neonStorageEstimateGb,
    neonTransferUsedGb,
    neonTransferEstimateGb,
  } = input;
  const numbers = [
    usedCredits,
    deploys,
    futureDeploys,
    runtimeForecast,
    otherReservedCredits,
    productionDeploysUsed,
    runtimeCreditsUsed,
    neonComputeUsed,
    neonComputeEstimate,
    neonStorageUsedGb,
    neonStorageEstimateGb,
    neonTransferUsedGb,
    neonTransferEstimateGb,
  ];
  if (
    numbers.some((value) => !Number.isFinite(value) || value < 0) ||
    !Number.isInteger(deploys) ||
    !Number.isInteger(futureDeploys) ||
    !Number.isInteger(productionDeploysUsed)
  )
    throw new Error('Supply current usage and nonnegative estimates for both providers.');
  const netlifyProjected =
    usedCredits + 15 * (deploys + futureDeploys) + runtimeForecast + otherReservedCredits;
  const neonComputeProjected = neonComputeUsed + neonComputeEstimate;
  const neonStorageProjected = neonStorageUsedGb + neonStorageEstimateGb;
  const neonTransferProjected = neonTransferUsedGb + neonTransferEstimateGb;
  return {
    withinPlanningCaps:
      netlifyProjected <= 240 &&
      15 * (productionDeploysUsed + deploys + futureDeploys) <= 60 &&
      runtimeCreditsUsed + runtimeForecast <= 180 &&
      neonComputeProjected <= 80 &&
      neonStorageProjected <= 0.8 &&
      neonTransferProjected <= 4,
    netlifyProjected,
    netlifyReserve: 300 - netlifyProjected,
    neonComputeProjected,
    neonStorageProjected,
    neonTransferProjected,
    notice:
      'Estimate only. Recheck actual plan, team usage, cycle dates, current rates, other service quotas and human approval before each remote operation.',
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = releasePlan(JSON.parse(await readFile(process.argv[2], 'utf8')));
    console.info(JSON.stringify(result, null, 2));
    if (!result.withinPlanningCaps) process.exitCode = 1;
  } catch {
    console.error(
      'Supply a JSON budget file based on current dashboards. Do not include credentials.',
    );
    process.exitCode = 1;
  }
}
