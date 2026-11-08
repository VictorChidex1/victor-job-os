import { discoverJobs, runDiscovery, runDiscoveryNow } from './jobs/discoverJobs.js'
import { analyzeJob, researchOpportunity, qualifyNewJobs } from './jobs/qualifyFunctions.js'
import {
  generatePitch,
  updateOutreachStatus,
  processFollowUps,
  runFollowUpsNow,
} from './outreach/outreachFunctions.js'
import {
  generateCoverLetter,
  generateApplicationAnswers,
} from './applications/preparationFunctions.js'
import {
  adminSetUserRole,
  adminSetUserDisabled,
  adminDeleteUser,
} from './admin/userManagement.js'
import {
  startAutomationInspection,
  cancelAutomationRun,
} from './automation/automationFunctions.js'

export {
  discoverJobs,
  runDiscovery,
  runDiscoveryNow,
  analyzeJob,
  researchOpportunity,
  qualifyNewJobs,
  generatePitch,
  updateOutreachStatus,
  processFollowUps,
  runFollowUpsNow,
  generateCoverLetter,
  generateApplicationAnswers,
  adminSetUserRole,
  adminSetUserDisabled,
  adminDeleteUser,
  startAutomationInspection,
  cancelAutomationRun,
}
